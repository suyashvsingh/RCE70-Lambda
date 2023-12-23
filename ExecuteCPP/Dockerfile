FROM public.ecr.aws/lambda/nodejs:12

RUN yum install -y gcc-c++ 

COPY app.js package.json ./

RUN npm install

CMD ["app.handler"]