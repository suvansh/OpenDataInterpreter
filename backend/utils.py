import re
import asyncio
import aiohttp
import aiofiles

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import matplotlib
matplotlib.rcParams['figure.autolayout'] = True
import seaborn as sns
import scipy
import requests
import io


def parse_LLM_response(response: str) -> dict:
    """ The response format is a string of the form: "CODE: <code spanning multiple lines>\nOUT_VARIABLE: <out_variable>\nIMG_PATHS: <img_paths>" """
    if response.startswith("ERROR:"):
        return {'error': response[7:]}
    code_pattern = r'CODE: (.*?)\n(?:OUT_VARIABLE:|IMG_PATHS)'
    out_variable_pattern = r'OUT_VARIABLE: (.*?)\nIMG_PATHS:'
    img_paths_pattern = r'IMG_PATHS: (.*)'
    
    if (code_search := re.search(code_pattern, response, re.DOTALL)):
        code = code_search.group(1).strip()
    else:
        code = ""
    if (out_search := re.search(out_variable_pattern, response, re.DOTALL)):
        out_variable = out_search.group(1).strip()
    else:
        out_variable = "out_variable"
    if (img_search:= re.search(img_paths_pattern, response, re.DOTALL)):
        img_paths_str = img_search.group(1).strip()
    else:
        img_paths_str = "[]"

    return {
        'code': code,
        'out_variable': out_variable,
        'img_paths_str': img_paths_str
    }

async def upload_images(images):
    if not images: return
    img_urls = []

    async def upload_image(image):
        url = "https://freeimage.host/api/1/upload?key=6d207e02198a847aa98d0a2a901485a5"

        async with aiofiles.open(image, 'rb') as f:
            image_data = await f.read()

        data = aiohttp.FormData()
        data.add_field('source', image_data, filename=image)

        async with aiohttp.ClientSession() as session:
            async with session.post(url, data=data) as response:
                response_json = await response.json()

                if response_json.get("status_code") == 200:
                    return response_json["image"]["url"]
    
    async with aiohttp.ClientSession() as session:
        tasks = [upload_image(image) for image in images]
        img_urls = await asyncio.gather(*tasks)

    return [url for url in img_urls if url is not None]

def check_code(code):
    # some of these are copilot-suggested and I rolled with them
    banned_words = ["open", "exec", "eval", "os", "sys", "subprocess", "pickle", "shutil", "urllib", "socket", "threading", "multiprocessing", "asyncio", "ctypes", "tkinter", "pywin", "pyqt", "pyglet", "pygame", "pyautogui", "pyperclip", "pyttsx3", "pyaudio"]
    # check if any banned words appear in the code
    for word in banned_words:
        if word in code:
            return False
    return True

allowed_builtins = {
    'abs': abs,
    'all': all,
    'any': any,
    'divmod': divmod,
    'enumerate': enumerate,
    'filter': filter,
    'isinstance': isinstance,
    'issubclass': issubclass,
    'len': len,
    'map': map,
    'max': max,
    'min': min,
    'pow': pow,
    'print': print,
    'range': range,
    'reversed': reversed,
    'round': round,
    'sorted': sorted,
    'sum': sum,
    'zip': zip,
    '__import__': __import__,
    'int': int,
    'float': float,
    'str': str,
    'bool': bool,
    'list': list,
    'dict': dict,
    'set': set,
    'tuple': tuple,
    # Add other allowed built-in functions here if needed
}

restricted_globals = {
    'pd': pd,
    'np': np,
    'plt': plt,
    'sns': sns,
    'scipy': scipy,
    'io': io,
    '__builtins__': allowed_builtins
}

def run_code(df, code):
    new_globals = restricted_globals.copy()
    new_globals['df'] = df
    exec(code, new_globals)
    return new_globals