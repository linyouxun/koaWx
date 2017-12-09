import sha1 from 'sha1'
import getRawBody from 'raw-body'
import msgParser from '../xml/parser'
import formater from '../xml/formatter'
import {Exception,ExceptionHandler} from './Exception'
import fetchData from '../fetch/request'

/**
 * middle ware
 * @param  {String} token [notice this token is for encrypt not access_token]
 * @return {async fn}       [middle ware]
 */
let WeConnector = (token)=>{
	return async(ctx,next)=>{
		if (ctx.path == '/post') {
			let{url, access_token, method} = ctx.query;
			let url2 = 'https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=' + access_token;
			console.log(url2);
			let d = await fetchData(url2,{
				"touser":"ouojHvgtZM6taivwCHjDeSoMeQFs",
				"template_id":"GUc6Mn7dq27dpBf_WhYp40Gk-KiVd8vXz4ESz1R5MvY",
				"url":"http://weixin.qq.com/download",        
				"data":{
						"first": {
							"value":"恭喜你购买成功！",
							"color":"#173177"
						},
						"orderMoneySum":{
							"value":"巧克力",
							"color":"#173177"
						},
						"orderProductName": {
							"value":"39.8元",
							"color":"#173177"
						},
						"Remark": {
							"value":"2014年9月22日",
							"color":"#173177"
						}
				}
			},method)
			return ctx.body = d;
		}
		try{
			let{signature,timestamp,nonce,echostr} = ctx.query;
			if(!signature || !timestamp || ! nonce){
				// not from wechat
				ctx.body = "wrong place"
				return
			}
			let sha = sha1([token,timestamp,nonce].sort().join(''))

			// get for wechat server test
			if(ctx.method==='GET'){
				if(sha === signature){
					ctx.body = echostr
				}

				else{
					ctx.body = "encrypt wrong!"
				}
			}
			// post for logic layer
			else if(ctx.method==='POST'){
				if(sha!==signature){
					ctx.body = 'wrong place'
					return
				}
				// get rawData
				let rawData = await getRawBody(ctx.req,{
					length:ctx.length,
	                limit:'1mb',
	                encoding:ctx.charset
				})

				// parse xml
				let xmlData = await msgParser(rawData)

				// format xml
				let xml = formater(xmlData.xml)
				console.info("xml obj : ",xml)

				ctx.wechat = {}
				ctx.wechat.req = xml

				// handle the request
				await next()

				// handle error
				if(!ctx.wechat.res) throw new Exception(`Can't handle the request ${ctx.wechat.req}`)
				
				// reply xml
				ctx.status = 200
				ctx.type = 'application/xml'
				ctx.body = ctx.wechat.res
				
			}
		}
		catch(e){
			ctx.body = ExceptionHandler(e)
		}
	}
}

export default WeConnector