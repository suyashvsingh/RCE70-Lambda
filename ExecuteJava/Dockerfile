FROM public.ecr.aws/lambda/nodejs:12

RUN yum install -y java

COPY app.js package.json ./

RUN npm install

CMD ["app.handler"]