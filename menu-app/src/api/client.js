import axios from 'axios';

// baseURL 은 이 파일 한 곳에만 적는다.
const client = axios.create({
  baseURL: 'http://localhost:8080',
});

// 서버 오류를 화면이 쓰는 한 가지 모양으로 바꾼다.
// - 서버가 ErrorResponse 를 보냈으면 { code, description, detail } 를 그대로 담는다.
// - 응답 자체가 없으면(서버가 꺼짐 등) type 이 'network' 다.
// 요청이 취소된 경우(axios.isCancel)는 화면에서 무시할 수 있도록 원래 오류를 그대로 던진다.
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isCancel(error)) return Promise.reject(error);

    const body = error.response?.data;
    if (body?.code) {
      return Promise.reject({
        type: 'server',
        status: error.response.status,
        code: body.code,
        description: body.description,
        detail: body.detail,
      });
    }

    return Promise.reject({
      type: 'network',
      status: error.response?.status ?? null,
      code: null,
      description: null,
      detail: error.message,
    });
  },
);

// 정상 응답 템플릿(ResponseMessage)에서 result 만 꺼낸다.
export const unwrap = (response) => response.data.result;

export const isCanceled = (error) => axios.isCancel(error);

export default client;
