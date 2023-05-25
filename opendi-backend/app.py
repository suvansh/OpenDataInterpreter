from starlette.middleware import Middleware
from fastapi import FastAPI, UploadFile, Form, File
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import json
import os

from prompts import get_sql_prompt, get_python_prompt
from utils import check_code, parse_LLM_response, run_code, upload_images
from settings import debug

from langchain.chat_models import ChatOpenAI
from langchain.schema import HumanMessage, AIMessage, SystemMessage
from langchain.chains.chat_vector_db.prompts import CONDENSE_QUESTION_PROMPT
from langchain.chains import LLMChain
from langchain.chains.conversational_retrieval.base import _get_chat_history
from langchain import PromptTemplate

import logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
# Create a file handler to save logs to a file
file_handler = logging.FileHandler("app.log")
file_handler.setLevel(logging.INFO)
# Create a formatter for the logs
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
file_handler.setFormatter(formatter)
# Add the file handler to the logger
logger.addHandler(file_handler)

def log(msg, allowLogging):
    if not allowLogging: return
    logger.info(msg)
    if debug:
        print(msg)


app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def process_file(headers_info, query, allowLogging):
    prompt = get_sql_prompt(headers_info)
    chat = ChatOpenAI()
    sql_code = chat([SystemMessage(content=prompt), HumanMessage(content=query)]).content
    log(f"SQL code: {sql_code}", allowLogging)
    return sql_code

async def process_file_df(df, headers_info, query, model, allowLogging):
    template = get_python_prompt(df, headers_info)
    prompt = PromptTemplate(template=template, input_variables=["query"])
    llm_chains = {
        "GPT-3.5": LLMChain(prompt=prompt, llm=ChatOpenAI(model_name="gpt-3.5-turbo", temperature=0.9), verbose=debug),
        "GPT-4": LLMChain(prompt=prompt, llm=ChatOpenAI(model_name="gpt-4", temperature=0.9), verbose=debug),
    }
    response = await llm_chains[model].apredict(query=query)
    log(f"LLM Response: {response}", allowLogging)
    output = parse_LLM_response(response)
    if 'error' in output:
        return {"answer": "Sorry, I don't know how to answer that question. Clearing the conversation and/or rephrasing may help, or I may just not have the data to answer.", "images": []}
    code, out_variable, img_paths_str = output["code"], output["out_variable"], output["img_paths_str"]
    if not check_code(code):
        log("Code check failed.", allowLogging)
        return {"answer": "Sorry, I don't know how to answer that question. Clearing the conversation and/or rephrasing may help, or I may just not have the data to answer.", "images": []}
    try:
        new_globals = run_code(df, code)
        # Get output
        out_str = eval(out_variable, new_globals)
        img_paths = eval(img_paths_str, new_globals)
    except Exception as e:
        logger.exception("An error occurred: %s", e)
        return {"answer": "Sorry, I don't know how to answer that question. Clearing the conversation and/or rephrasing may help, or I may just not have the data to answer.", "images": []}
    
    if len(img_paths) == 1 and not img_paths[0].endswith("png"):
        img_paths[0] = new_globals.get(img_paths[0], img_paths[0])
    img_paths = [img_path for img_path in img_paths if img_path]
    
    log(f"Final output: {out_str}", allowLogging)
    image_urls = await upload_images(img_paths)
    log(f"Image URLs: {image_urls}", allowLogging)
    return {"answer": out_str, "images": image_urls}
    
def get_standalone_query(messages, allowLogging):
    if len(messages) > 1:
        chat_tuples = [(messages[i]['text'], messages[i+1]['text']) for i in range(0, len(messages)-1, 2)]
        llm = ChatOpenAI()
        question_generator = LLMChain(llm=llm, prompt=CONDENSE_QUESTION_PROMPT)
        query = question_generator.predict(question=messages[-1]['text'], chat_history=_get_chat_history(chat_tuples))
        log("Standalone Query: " + query, allowLogging)
    else:
        query = messages[-1]['text']
    return query

@app.post("/heavy")
async def handle_query_heavy(file: UploadFile = File(...), columnData: str = Form(...), messages: str = Form(...), model: str = Form(...), allowLogging: bool = Form(...)):
    df = pd.read_csv(file.file, skipinitialspace=True)
    headers_info = json.loads(columnData)
    message_list = json.loads(messages)
    query = get_standalone_query(message_list, allowLogging)
    result = await process_file_df(df, headers_info, query, model, allowLogging)
    return result

@app.post("/light")
async def handle_query_light(columnData: str = Form(...), messages: str = Form(...), allowLogging: bool = Form(...)):
    headers_info = json.loads(columnData)
    message_list = json.loads(messages)
    query = get_standalone_query(message_list, allowLogging)
    result = process_file(headers_info, query, allowLogging)
    return {"answer": result}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)


