const Promise = require('bluebird');
const request = Promise.promisify(require("request"));

function fetchData(url,formData = {},method = "GET",headers = {}) {
  let options = {
    timeout: 8000,
    method: 'POST',
    url,
    headers,
    formData
  };
  return new Promise((resolve, reject) => {
    request(options).then(({body}) => { //尝试抓取
      console.log(body)
      return body;
    }).catch(e => {
      reject({
        code: -1,
        msg: `抓取错误：${e.message}`,
      });
    }).then(body => {  //抓取成功，解析JSON
      return Promise.try(() => JSON.parse(body));
    }).catch(e => {  //解析ERROR
      reject({
        code: -3,
        msg: `JSON解析错误：${e.message}`
      });
    }).then(JSONBody => {  // 正常返回数据，判断code === 200
      return resolve(JSONBody);
    });
  });
}

module.exports = fetchData;
