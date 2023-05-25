import pandas as pd
import json
import io
import hashlib

from starlette.middleware import Middleware
from fastapi import FastAPI, UploadFile, Form, File
from fastapi.middleware.cors import CORSMiddleware

from prompts import get_sql_prompt, get_python_prompt
from utils import check_code, parse_LLM_response, run_code, upload_images
from settings import debug
from example_queries import example_queries

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


async def process_file(headers_info, query, model, allowLogging, df=None):
    resp_type = "sql" if df is None else "python"
    if resp_type == "sql":  # SQL mode – no dataframe
        template = get_sql_prompt(headers_info)
    else:  # Python mode – use dataframe
        template = get_python_prompt(df, headers_info)
    prompt = PromptTemplate(template=template, input_variables=["query"])
    llm_chains = {
        "GPT-3.5": LLMChain(prompt=prompt, llm=ChatOpenAI(model_name="gpt-3.5-turbo", temperature=0.9), verbose=debug),
        "GPT-4": LLMChain(prompt=prompt, llm=ChatOpenAI(model_name="gpt-4", temperature=0.9), verbose=debug),
    }
    response = await llm_chains[model].apredict(query=query)
    log(f"LLM Response: {response}", allowLogging)
    if resp_type == "sql":  # SQL mode – return code
        return {"type": resp_type, "code": response}
    else:
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
        return {"answer": out_str, "images": image_urls, "type": resp_type, "code": code}
    
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
    file_bytes = await file.read()
    message_list = json.loads(messages)
    headers_info = json.loads(columnData)
    log(f"Received request ({model}): {message_list[-1]['text']}", allowLogging)

    if (cached := example_queries.get(message_list[-1]['text'])):
        sha256_hash = hashlib.sha256()
        sha256_hash.update(file_bytes)
        file_hash = sha256_hash.hexdigest()
        if file_hash == cached['file_hash']:
            log("Cached file hit.", allowLogging)
            return {key: cached[key] for key in ['answer', 'images']}   
    
    df = pd.read_csv(io.BytesIO(file_bytes), skipinitialspace=True)    
    query = get_standalone_query(message_list, allowLogging)
    result = await process_file(headers_info, query, model, allowLogging, df=df)
    return result

@app.post("/light")
async def handle_query_light(columnData: str = Form(...), messages: str = Form(...), model: str = Form(...), allowLogging: bool = Form(...)):
    headers_info = json.loads(columnData)
    message_list = json.loads(messages)
    query = get_standalone_query(message_list, allowLogging)
    result = await process_file(headers_info, query, model, allowLogging)
    return result

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)


