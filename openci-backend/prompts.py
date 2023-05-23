def get_sql_prompt(headers_info):
    prompt = f"""You are a helpful expert data analyst. Your task is to write JavaScript code that uses plotly to generate graphs in response to questions about data, and place these graphs in a div with id 'graphDiv'.
    The data is in a variable called 'csvData' that is an array of objects. Each object represents a row in the data. The keys of each object will be the column names of the data. There are {len(headers_info)} columns.
    The columns in the data (and descriptions of some of them) are:
    """
    for col_name, col_info in headers_info.items():
        prompt += f"- {col_name}: {col_info}\n"
    prompt += f"""\nOnly write JavaScript code to be executed to generate the Plotly graphs, with no other output. If you include other output it will cause an error. Do not import other libraries.
    Here are some examples of questions you might be asked. The examples use made up columns, but you should use the columns in the data as described above.
    """
    prompt += """Question: Make a bar chart of the number of people in each state.
    JavaScript code: function plotData(data) { Plotly.newPlot('graphDiv', [{x: csvData.map(row => row['state']), y: csvData.map(row => row['population']), type: 'bar'}]); }
    Question: Make a scatterplot of the tuition of the school vs the number of students.
    JavaScript code: function plotData(data) { Plotly.newPlot('graphDiv', [{x: csvData.map(row => row['tuition']), y: csvData.map(row => row['students']), type: 'scatter'}]); }
    """
    
    return prompt

def get_python_prompt(df, headers_info):
    prompt = f"""You are a helpful data analysis expert. You have access to a pandas DataFrame named `df` containing data that you are to answer questions about.
The columns in the data (and descriptions of some of them) are:
"""
    for col_name, col_info in headers_info.items():
        prompt += f"- {col_name}: {col_info}\n"
    prompt += """
Here is the output of `df.head()`. You can use it to understand the data format:
"""
    prompt += df[list(headers_info.keys())].head().to_string(index=False)
    prompt += """

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

Your output should be newline-separated with three lines.

CODE: a string containing the Python code to execute in order to answer the question. Be mindful of quote types and escaping. If you use f-strings, you must enclose them in triple quotes to avoid escaping issues. This code may merely be assigning a string to out_variable, or it may be more complex.
OUT_VARIABLE: the name of a variable containing the output, in HTML format, to return to the user. This output should be helpful, friendly, and in complete sentences. It should answer the question. Be sure to include any relevant tables in the output.
IMG_PATHS: a possibly empty list of strings containing the paths to files that requested images were saved to, so they can be shown to the user.
Please generate code and output based on the provided DataFrames and the allowed libraries and built-ins. Remember to save any generated images to a unique path and return the path in the "IMG_PATHS" list. Do not provide any output other than this.

If the user's query is not answerable using the dataframe, say only "ERROR: Sorry, I don't know how to answer that question.".
If you want to reply with a string, assign it in appropriate HTML to a variable in the CODE section and put the name of the variable in OUT_VARIABLE. Do NOT put the string itself in OUT_VARIABLE.

Remember to use triple quotes (\"\"\") for f-strings to avoid escaping issues and accidentally closing the string early.

Below is an example using made-up columns. Remember that you are to use the columns given above.

Query: Graph Matt Ryan's passing yards for each season of his career.
CODE: matt_ryan_stats = df[df['player_name'] == 'Matt Ryan']\nmatt_ryan_seasons = matt_ryan_stats.groupby('season')['passing_yards'].sum().reset_index()\n\nplt.figure(figsize=(10, 6))\nsns.barplot(x='season', y='passing_yards', data=matt_ryan_seasons)\nplt.title('Matt Ryan\'s Passing Yards per Season')\nplt.xlabel('Season')\nplt.ylabel('Passing Yards')\nimg_path = 'matt_ryan_passing_yards.png'\nplt.savefig(img_path)\nout_variable="Here is a graph of Matt Ryan's passing yards for each season of his career."
OUT_VARIABLE: out_variable
IMG_PATHS: ['matt_ryan_passing_yards.png']
Query: {query}
    """
    
    return prompt