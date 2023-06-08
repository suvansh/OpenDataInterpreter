import { useState, useEffect } from 'react';
import Head from 'next/head';
import Dropzone from 'react-dropzone-uploader';
import Papa from 'papaparse';
import 'react-dropzone-uploader/dist/styles.css';
import Chat from '../components/Chat';
import ModeButtons from '../components/ModeButtons'
import Tooltip from '../components/Tooltip'
import SocialMetaTags from '../components/SocialMetaTags';
import NavBar from '../components/NavBar'
import { createSqlJsTable } from '../lib/SqlUtils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMoon, faSun } from '@fortawesome/free-solid-svg-icons';



const Home = () => {
  const [csvFile, setCsvFile] = useState(null);
  const [csvData, setCsvData] = useState([]);
  const [sqlDb, setSqlDb] = useState(null);
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [headerValues, setHeaderValues] = useState({});
  const [dropzoneKey, setDropzoneKey] = useState(0);

  const [apiError, setApiError] = useState('');
  const [isErrorMessageVisible, setIsErrorMessageVisible] = useState(false);

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [model, setModel] = useState("GPT-4");
  const [lang, setLang] = useState("python");
  const [allowLogging, setAllowLogging] = useState(false);
  
  const [darkMode, setDarkMode] = useState(true);


  useEffect(() => {
    if (csvData.length === 0) {
      setSqlDb(null);
      return;
    }
    const innerCreateSqlJsTable = async () => {
      try {
        // Wait for createSqlJsTable to finish and then update the state
        const db = await createSqlJsTable(csvData);
        setSqlDb(db);
      } catch (err) {
        const msg = 'Error loading CSV file into SQL.js. Please use Python instead for this file.';
        setTempApiError(msg, 10);
        alert(msg);
        return;
      }
    };
    
    innerCreateSqlJsTable();
  }, [csvData]);

  const sampleCsvFiles = [
    { name: 'Freshmen Weights (kg)', url: '/csvs/freshman_kgs.csv', sampleQuery: 'Make a scatterplot of the men\'s weight in April vs September. Draw a line indicating no weight change.', sampleLang: 'python', sampleModel: 'GPT-4' },
    { name: 'Tallahassee Housing', url: '/csvs/zillow.csv', sampleQuery: 'Create a scatterplot showing how square footage varies by year, coloring points by their price.', sampleLang: 'python', sampleModel: 'GPT-4' },
    { name: 'Baseball Players', url: '/csvs/mlb_players.csv', sampleQuery: 'Make a table of the average Shortstop age of each team, in descending order.', sampleLang: 'sql', sampleModel: 'GPT-3.5' },
  ];

  const handleSampleSelect = async (event) => {
    const selectedUrl = event.target.value;
    if (selectedUrl === "") {
      setCsvHeaders([]);
      setCsvData([]);
      setHeaderValues({});
      setDropzoneKey(prevKey => prevKey + 1);
      setCsvFile(null);
      return;
    }

    const response = await fetch(selectedUrl);
    let text = await response.text();
    text = text.replace(/, /g, ',');
    
    const results = await new Promise((resolve, reject) => {
      Papa.parse(text, {
        skipEmptyLines: true,
        complete: resolve,
        error: reject,
      });
    });
  
    const trimmedHeaders = results.data[0].map(header => header.trim());
    const csvDataTrimmedHeaders = [trimmedHeaders, ...results.data.slice(1)];
  
    setCsvHeaders(trimmedHeaders);
    setCsvData(csvDataTrimmedHeaders);
  
    const initialHeaderValues = trimmedHeaders.reduce((acc, header) => {
      acc[header] = '';
      return acc;
    }, {});
  
    setHeaderValues(initialHeaderValues);
    setDropzoneKey(prevKey => prevKey + 1);
    setCsvFile(null);
    
    const sampleItem = sampleCsvFiles.find(sample => sample.url === selectedUrl);
    setNewMessage(sampleItem.sampleQuery);
    setLang(sampleItem.sampleLang);
    setModel(sampleItem.sampleModel);
  };

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(prevDarkMode => !prevDarkMode);
  };  

  

  const handleChangeStatus = async ({ meta, file }, status) => {
    if (status === 'done') {

      setCsvFile(file); // Keep a reference to the file itself
      let text = await file.text();
      text = text.replace(/, /g, ',');
      const results = await new Promise((resolve, reject) => {
        Papa.parse(text, {
          skipEmptyLines: true,
          complete: resolve,
          error: reject,
        });
      });

      const trimmedHeaders = results.data[0].map(header => header.trim());
      
      setCsvHeaders(trimmedHeaders);
      setCsvData(results.data);

      const initialHeaderValues = trimmedHeaders.reduce((acc, header) => {
        acc[header] = '';
        return acc;
      }, {});

      setHeaderValues(initialHeaderValues);
      
      // Reset the sample select dropdown
      document.getElementById('sampleSelect').value = '';
    }
    else if (status === 'removed') {
      setCsvFile(null);
      setCsvHeaders([]);
      setCsvData([]);
      setHeaderValues({});
    }
  };
  
  const setTempApiError = (message, timeoutSeconds = 5) => {
    setApiError(message);
    setIsErrorMessageVisible(true);
  
    setTimeout(() => {
      setIsErrorMessageVisible(false); // Hide the error message after 5 seconds
    }, timeoutSeconds * 1000);
  }

  const handleInputChange = (header, value) => {
    setHeaderValues(prevValues => ({
      ...prevValues,
      [header]: value,
    }));
  };

  const removeHeader = (indexToRemove, headerToRemove) => {
    // Update csvHeaders
    setCsvHeaders(csvHeaders.filter((_, index) => index !== indexToRemove));
  
    // Update headerValues
    const newHeaderValues = {...headerValues};
    delete newHeaderValues[headerToRemove];
    setHeaderValues(newHeaderValues);
  };

  const handleSubmit = async (e, newMessage = null) => {
    e.preventDefault();

    if (!csvFile && csvData.length === 0) {
      setTempApiError('No CSV file uploaded.');
      return;
    }

    try {
      setIsSubmitting(true);
      let formData = new FormData();
      if (lang == "python") {  // only send csv if python mode
        if (csvFile) {
          // If a file was uploaded, append it to the form data
          formData.append('file', csvFile);
        } else {
          // If a file was not uploaded, create a Blob from the csvData and append it
          const csvContent = csvData.map(row => row.join(",")).join("\n");
          const csvBlob = new Blob([csvContent], { type: 'text/csv' });
          formData.append('file', csvBlob, 'sample.csv');
        }
      }
      formData.append('columnData', JSON.stringify(headerValues));
      const updatedMessages = newMessage
        ? [...messages, { text: newMessage, isUser: true, images: [] }]
        : [...messages];
      setMessages(updatedMessages);
      formData.append('messages', JSON.stringify(updatedMessages));
      formData.append('model', model);
      formData.append('lang', lang);
      formData.append('allowLogging', allowLogging);
      
      
      const res = await fetch(`https://openci-server.brilliantly.ai/heavy`, {
      // const res = await fetch(`http://localhost:8000/heavy`, {
        method: 'POST',
        body: formData,
      });
	  
      if (res.ok) {
        const responseBody = await res.json();
        let asstMsg;
        if (responseBody.lang == "sql") {
          let sqlCode = responseBody['code'];
          try {
            let result = sqlDb.exec(sqlCode);
            let sqlOut;
            if (result.length === 0) {
              sqlOut = { columns: ["<Empty>"], values: [["<Empty>"]] };
            } else {
              sqlOut = result[0];
            }
            asstMsg = JSON.stringify(sqlOut);
          } catch (err) {
            asstMsg = JSON.stringify({"columns":["ERR"],"values":[[err.message]]});
          }
        } else {
          asstMsg = responseBody.answer;
        }
        setMessages([...updatedMessages, { text: asstMsg,
                                            isUser: false,
                                            images: responseBody.images,
                                            code: responseBody.code,
                                            lang: responseBody.lang }]);
      } else {
        setTempApiError('An error occurred while processing your file.');
      }
    } catch (err) {
	    console.log(err);
      setMessages(prevMessages => prevMessages.slice(0, -1));
      if (err.response && err.response.status === 413) {
        setTempApiError('File too large. Please upload a file smaller than 25MB.');
      } else {
        setTempApiError('An error occurred while processing your file.');
      }
    } finally {
      setIsSubmitting(false); // End submission regardless of success or failure
    }
  };

  return (
    <>
      <Head>
        <title>Open Data Interpreter: Talk to your data.</title>
      </Head>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <SocialMetaTags
          title="Open Data Interpreter: Talk to your data."
          description="Made with love and AI by Brilliantly."
          url="https://datainterpreter.brilliantly.ai/"
          imageUrl="https://datainterpreter.brilliantly.ai/logo.png"
        />
        <NavBar />
        
        <div
          className="flex flex-col w-full max-w-7xl bg-white dark:bg-gray-800 shadow-md rounded px-8 pt-6 pb-8 mb-4 overflow-auto"
          style={{height: 'calc(100vh - 100px)', marginTop: '60px'}}
        >
          <h1
            className="text-6xl font-bold text-center pb-2"
            style={{
                fontFamily: 'Quicksand',
                fontWeight: 'bold',
                backgroundImage: 'linear-gradient(135deg, #CB5EEE 0%, #4BE1EC 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
            }}
          >
            <span>
              <button
                className="focus:outline-none"
                onClick={toggleDarkMode}
                style={{ color: '#B67EEF' }}
              >
                <FontAwesomeIcon icon={darkMode ? faSun : faMoon} />
              </button>pen Data Interpreter
            </span>
          </h1>
          <div className="pl-4 text-center">
            <a className="github-button" href="https://github.com/suvansh" data-color-scheme="no-preference: dark; light: light; dark: dark;" aria-label="Follow @suvansh on GitHub">Follow @suvansh</a>
            <a className="github-button" href="https://github.com/suvansh/OpenDataInterpreter" data-color-scheme="no-preference: dark; light: light; dark: dark;" aria-label="Star suvansh/OpenDataInterpreter on GitHub">Star</a>  
          </div>
          <p className="text-center text-gray-700 dark:text-gray-200 pb-2">Read about how it works <a href="https://www.brilliantly.ai/blog/data-interpreter">here</a>.</p>
          <div className="flex flex-grow overflow-auto">
            <div className="w-full lg:w-1/2 overflow-auto">
              <form onSubmit={handleSubmit} className="w-full max-w-7xl bg-white dark:bg-gray-800 shadow-md rounded px-8 pt-6 pb-8 mb-4">
                <div className="mb-4 bg-gray-200 dark:bg-gray-500">
                  <select
                    id="sampleSelect"
                    defaultValue=""
                    onChange={handleSampleSelect}
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "none",
                      borderRadius: "5px",
                      boxShadow: "0px 2px 5px rgba(0,0,0,0.15)",
                      fontSize: "16px",
                      marginBottom: "15px",
                    }}
                  >
                    <option value="">Select a sample CSV...</option>
                    {sampleCsvFiles.map((file, index) => (
                      <option key={index} value={file.url}>{file.name}</option>
                    ))}
                  </select>
                  <Dropzone
                    key={dropzoneKey}
                    inputContent="Drag a CSV file or Click to Browse"
                    onChangeStatus={handleChangeStatus}
                    accept=".csv"
                    maxFiles={1}
                  />
                </div>
                {csvHeaders.map((header, index) => (
                  <div className="mb-4 flex items-center" key={index}>
                    <label className="block text-gray-700 dark:text-gray-200 text-sm font-bold mb-2 w-1/3 text-right pr-4 align-middle" htmlFor={header}>
                      {header}
                    </label>
                    <input
                      className="shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline flex-grow"
                      id={header}
                      type="text"
                      placeholder={`Description of ${header}`}
                      value={headerValues[header] || ''}
                      onChange={(e) => handleInputChange(header, e.target.value)}
                    />
                    <button type="button" onClick={() => removeHeader(index, header)} className="ml-2 py-2 text-gray-700 dark:text-gray-200">✕</button>
                  </div>
                ))}
                <ModeButtons 
                  options={['GPT-4', 'GPT-3.5']}
                  tooltipContent={<><p>GPT-3.5 is ~5x faster and 15x cheaper than GPT-4, but less reliable for Python mode. Both work well for SQL mode.</p></>}
                  selectedOption={model}
                  onOptionChange={setModel}
                />
                <ModeButtons 
                  options={[{'value': 'python', 'name': 'Python'}, {'value': 'sql', 'name': 'SQL (in-browser)'}]}
                  tooltipContent={<><p>&quot;Python&quot; sends the file to our server but is more robust/capable. &quot;SQL&quot; only sends column names/descriptions to the server, but can&apos;t handle missing data or generate graphs.</p></>}
                  selectedOption={lang}
                  onOptionChange={setLang}
                />
                <div className="flex items-center my-2">
                  <input
                    type="checkbox"
                    id="allowLogging"
                    checked={allowLogging}
                    onChange={(e) => setAllowLogging(prevAllowLogging => !prevAllowLogging)}
                    className="form-checkbox h-5 w-5 text-blue-600 mr-2"
                  />
                  <label htmlFor="allowLogging" className="text-gray-700 dark:text-gray-200">
                    Allow server logging
                  </label>
                  <Tooltip content={ <>Logs may include parts of uploaded data and the server response. Either way, your file is not stored. </> } />
                </div>


                <div className="flex items-center justify-between">
                  {apiError && isErrorMessageVisible && <p className="text-red-500 dark:text-red-400">{apiError}</p>}
                </div>
              </form>
              <div className="overflow-y-auto" style={{ maxHeight: "50vh" }}>
                <table className="text-gray-700 dark:text-gray-200">
                  <thead>
                    <tr>
                      {csvData[0] && Object.values(csvData[0]).map(val => <th key={val}>{val}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {csvData.slice(1, 51).map((row, index) => (
                      <tr key={index}>
                        {Object.values(row).map((value, index) => <td key={index}>{value}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {csvData.length > 51 ? <p className="text-gray-700 dark:text-gray-200">(Showing first 50 rows...)</p> : null}
              </div>
            </div>
            <div className="w-full lg:w-1/2 overflow-auto" style={{ maxHeight: `calc(90vh - 100px)` }}>
              <Chat 
                messages={messages}
                setMessages={setMessages}
                newMessage={newMessage}
                setNewMessage={setNewMessage}
                onSendMessage={handleSubmit}
                isSubmitting={isSubmitting}
                sqlDb={sqlDb}
              />
            </div>
          </div>
        </div>
      </div>
    </>

  );
};

export default Home;
