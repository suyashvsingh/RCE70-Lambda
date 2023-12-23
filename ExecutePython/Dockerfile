FROM public.ecr.aws/lambda/nodejs:12

RUN yum install -y python

COPY app.js package.json ./

RUN npm install

CMD ["app.handler"]