# Open Data Interpreter

## Backend
To run the backend, run the following commands:
```
export OPENAI_API_KEY=sk-your-key-here
python opendi-backend/app.py
```

## Frontend
To run the frontend, see the instructions in [the README there](opendi-frontend/README.md).
You can modify the endpoint for the POST request in [this file](opendi-frontend/pages/index.js) to run it against your locally running backend.