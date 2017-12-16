FROM beevelop/nodejs-python:latest

RUN python -m pip install pandas

EXPOSE 8080

WORKDIR /usr/src/app

COPY package*.json ./

COPY server/* ./

RUN npm install

COPY calculate_best_path_3.py ./

CMD [ "npm", "start" ]
