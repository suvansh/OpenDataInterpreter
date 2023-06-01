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
from langchain.prompts import ChatPromptTemplate

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

def log(msg, allowLogging, error=False):
    if not allowLogging: return
    if not error:
        logger.info(msg)
    else:
        logger.exception("An error occurred: %s", msg)
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


async def process_file(headers_info, query, model, lang, allowLogging, df=None):
    if lang == "sql":  # SQL mode – no dataframe
        template, parser = get_sql_prompt(headers_info)
    else:  # Python mode – use dataframe
        template, parser = get_python_prompt(df, headers_info)
    messages = template.format_messages(query=query)
    log(messages, allowLogging)
    llm_chains = {
        "GPT-3.5": ChatOpenAI(model_name="gpt-3.5-turbo", temperature=0.9),
        "GPT-4": ChatOpenAI(model_name="gpt-4", temperature=0.9)
    }
    response = await llm_chains[model].apredict_messages(messages)
    log(f"LLM Response: {response.content}", allowLogging)
    try:
        output = parser.parse(response.content)
    except Exception as e:
        log(e, allowLogging, error=True)
        return {"answer": "[Error] Got an error parsing the LLM response.", "images": [], "lang": lang, "code": "Code could not be parsed from LLM response." }
    log(f"LLM Response: {output}", allowLogging)
    if lang == "sql":  # SQL mode – return code
        return {"lang": lang, "code": output.code}
    else:   
        code, out_variable, img_paths = output.code, output.out_variable, output.img_paths
        if not check_code(code):
            log("Code check failed.", allowLogging)
            return {"answer": "[Error] The generated code was not safe to run.", "images": [], "lang": lang, "code": code }
        try:
            new_globals = run_code(df, code)
            # Get output
            out_str = eval(out_variable, new_globals)
        except Exception as e:
            log(e, allowLogging, error=True)
            return {"answer": "[Error] Got an error while running the code.", "images": [], "lang": lang, "code": code }
        
        log(f"Final output: {out_str}", allowLogging)
        image_urls = await upload_images(img_paths)
        log(f"Image URLs: {image_urls}", allowLogging)
        return {"answer": out_str, "images": image_urls, "lang": lang, "code": code}
    
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
async def handle_query_heavy(columnData: str = Form(...), messages: str = Form(...), model: str = Form(...), lang: str = Form(...), allowLogging: bool = Form(...), file: UploadFile = File(None)):
    assert (lang == "python" and file is not None) or (lang == "sql" and file is None)
    message_list = json.loads(messages)
    headers_info = json.loads(columnData)
    log(f"Received request ({model}): {message_list[-1]['text']}", allowLogging)

    if file is not None:
        file_bytes = await file.read()
        df = pd.read_csv(io.BytesIO(file_bytes), skipinitialspace=True)
        to_hash = file_bytes
    else:
        df = None
        to_hash = columnData.encode('UTF-8')
    if (cached := example_queries.get(message_list[-1]['text'])) and cached['lang'] == lang:
        sha256_hash = hashlib.sha256()
        sha256_hash.update(to_hash)
        hashed = sha256_hash.hexdigest()
        if hashed == cached['hash']:
            log("Cached file hit.", allowLogging)
            dupe = cached.copy()
            dupe.pop('hash')
            return dupe
    
    
    query = get_standalone_query(message_list, allowLogging)
    result = await process_file(headers_info, query, model, lang, allowLogging, df=df)
    return result


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)


