from langchain.output_parsers import ResponseSchema
from langchain.output_parsers import PydanticOutputParser, StructuredOutputParser
from langchain.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field, validator
from typing import List

class PythonOutput(BaseModel):
    code: str = Field(..., description="Python code to answer the question using data in the Pandas dataframe `df`.")
    out_variable: str = Field(..., description="The name of a Python variable resulting from executing the above code, that contains human-readable text answering the user's question.")
    img_paths: List[str] = Field(..., description="A comma-separated Python list of string paths to images saved upon executing the Python code.")

class SQLOutput(BaseModel):
    code: str = Field(..., description="SQL code to answer the question using data in the SQL table `mytable`.")


def get_sql_prompt(headers_info):
    parser = PydanticOutputParser(pydantic_object=SQLOutput)
    format_instructions = parser.get_format_instructions()

    template = f"""You are a helpful expert data analyst. Your task is to write SQL code for the table called `mytable` to answer queries about the data.
    There are {len(headers_info)} columns. The columns in the data (and descriptions of some of them) are:
    """
    for col_name, col_info in headers_info.items():
        template += f"- {col_name}: {col_info}\n"
    template += """\nOnly write SQL code to be executed to answer the question, with no other output. If you include other output it will cause an error.
    If column names have spaces or special characters, you must use backticks to escape them, e.g. `Height (inches)`.
    
    {format_instructions}
    
    Query: {query}
    """
    
    return ChatPromptTemplate.from_template(
        template,
        partial_variables={"format_instructions": format_instructions}
    ), parser

def get_python_prompt(df, headers_info):
    parser = PydanticOutputParser(pydantic_object=PythonOutput)
    format_instructions = parser.get_format_instructions()

    template = f"""You are a helpful data analysis expert. You have access to a pandas DataFrame named `df` containing data that you are to answer questions about.
The columns in the data (and descriptions of some of them) are:
"""
    for col_name, col_info in headers_info.items():
        template += f"- {col_name}: {col_info}\n"
    template += """
Here is the output of `df.head()`. You can use it to understand the data format:
"""
    template += df[list(headers_info.keys())].head().to_string(index=False)
    template += """

Be sure to use only columns specified above.
You can use the following libraries (with their respective aliases if specified) without importing them.

numpy (as np)
pandas (as pd)
seaborn (as sns)
matplotlib.pyplot (as plt)
scipy
requests
io

You are allowed to use these Python built-in functions:
['abs', 'all', 'any', 'divmod', 'enumerate', 'filter', 'isinstance', 'issubclass', 'len', 'map', 'max', 'min', 'pow', 'print', 'range', 'reversed', 'round', 'sorted', 'sum', 'zip']

When generating an image, do not use `plt.show()`. Instead, save the image with `plt.savefig()` to a unique path. When outputting a dataframe, use the `to_html(index=False)` method to convert it to HTML.

For the query, provide the following information:

code: Python code to answer the question and generate a response to the user. Be mindful of quote types and escaping. If you use f-strings, you must enclose them in triple single-quotes (NOT double-quotes) to avoid escaping issues. This code may merely be assigning a string to out_variable, or it may be more complex. If the user's query is not answerable using the dataframe, return an empty code block.

out_variable: The name of a variable that contains the output, in HTML format, to return to the user after running the code. This output should be helpful, friendly, and in complete sentences. It should answer the question. Be sure to include any relevant tables in the output.

img_paths: Generate a comma-separated Python list of paths to images containing outputs saved upon executing the Python code.

Please generate code and output based on the provided DataFrames and the allowed libraries and built-ins. Remember to save any generated images or files to a unique path and return the path in the "file_paths" list. Do not provide any output other than this.
If you want to reply with a string, assign it in appropriate HTML to a variable in the code section and put the name of the variable in out_variable.
In your code, only use single-quotes for strings, not double-quotes. If you need to use double-quotes, enclose the string in triple single-quotes.
When escaping characters, use double-backslashes, since the code string will be parsed twice.

{format_instructions}

Query: {query}
"""
    
    return ChatPromptTemplate.from_template(
        template,
        partial_variables={"format_instructions": format_instructions}
    ), parser


# TODO get plotly viz working for in-browser viz
# def get_plotly_prompt(headers_info):
#     prompt = f"""You are a helpful expert data analyst. Your task is to write JavaScript code that uses plotly to generate graphs in response to questions about data, and place these graphs in a div with id 'graphDiv'.
#     The data is in a variable called 'csvData' that is an array of objects. Each object represents a row in the data. The keys of each object will be the column names of the data. There are {len(headers_info)} columns.
#     The columns in the data (and descriptions of some of them) are:
#     """
#     for col_name, col_info in headers_info.items():
#         prompt += f"- {col_name}: {col_info}\n"
#     prompt += f"""\nOnly write JavaScript code to be executed to generate the Plotly graphs, with no other output. If you include other output it will cause an error. Do not import other libraries.
#     Here are some examples of questions you might be asked. The examples use made up columns, but you should use the columns in the data as described above.
#     """
#     prompt += """Question: Make a bar chart of the number of people in each state.
#     JavaScript code: function plotData(data) { Plotly.newPlot('graphDiv', [{x: csvData.map(row => row['state']), y: csvData.map(row => row['population']), type: 'bar'}]); }
#     Question: Make a scatterplot of the tuition of the school vs the number of students.
#     JavaScript code: function plotData(data) { Plotly.newPlot('graphDiv', [{x: csvData.map(row => row['tuition']), y: csvData.map(row => row['students']), type: 'scatter'}]); }
#     """
    
#     return prompt