define(["fetchHelper","dom","registrationServices","loading","confirm","globalize","connectionManager","emby-linkbutton","emby-collapse","emby-input","emby-button"],function(fetchHelper,dom,registrationServices,loading,confirm,globalize,connectionManager){"use strict";function getPluginSecurityInfo(){var apiClient=ApiClient;return apiClient.getJSON(apiClient.getUrl("Plugins/SecurityInfo"))}function load(page){loading.show(),getPluginSecurityInfo().then(function(info){page.querySelector("#txtSupporterKey").value=info.SupporterKey||"",info.SupporterKey&&!info.IsMBSupporter?(page.querySelector("#txtSupporterKey").classList.add("invalidEntry"),page.querySelector(".notSupporter").classList.remove("hide")):(page.querySelector("#txtSupporterKey").classList.remove("invalidEntry"),page.querySelector(".notSupporter").classList.add("hide")),info.IsMBSupporter?(page.querySelector(".supporterContainer").classList.add("hide"),getPremiereStatus(info.SupporterKey).then(function(statusInfo){if(statusInfo){var statusLine,indicator=page.querySelector("#status-indicator .listItemIcon"),extendedPlans=page.querySelector("#extended-plans");switch(extendedPlans.innerHTML=globalize.translate("MessagePremiereExtendedPlans",'<a is="emby-linkbutton" class="button-link" href="https://emby.media/premiere-ext.html" target="_blank">',"</a>"),statusInfo.deviceStatus){case 2:statusLine=globalize.translate("MessagePremiereStatusOver",statusInfo.planType),indicator.classList.add("expiredBackground"),indicator.classList.remove("nearExpiredBackground"),indicator.innerHTML="&#xE000;",extendedPlans.classList.remove("hide");break;case 1:statusLine=globalize.translate("MessagePremiereStatusClose",statusInfo.planType),indicator.classList.remove("expiredBackground"),indicator.classList.add("nearExpiredBackground"),indicator.innerHTML="&#xE000;",extendedPlans.classList.remove("hide");break;default:statusLine=globalize.translate("MessagePremiereStatusGood",statusInfo.planType),indicator.classList.remove("expiredBackground"),indicator.classList.remove("nearExpiredBackground"),indicator.innerHTML="&#xE5CA;",extendedPlans.classList.add("hide")}page.querySelector("#premiere-status").innerHTML=statusLine;var subsElement=page.querySelector("#premiere-subs");if(statusInfo.subscriptions&&statusInfo.subscriptions.length>0){page.querySelector("#premiere-subs-content").innerHTML=getSubscriptionHtml(statusInfo.subscriptions,info.SupporterKey);var sub=page.querySelector(".lnkSubscription");sub&&sub.addEventListener("click",cancelSub),subsElement.classList.remove("hide")}else subsElement.classList.add("hide");page.querySelector(".isSupporter").classList.remove("hide")}})):(page.querySelector(".supporterContainer").classList.remove("hide"),page.querySelector(".isSupporter").classList.add("hide")),loading.hide()})}function getPremiereStatus(key){var postData="key="+key+"&serverId="+ApiClient.serverId();return fetchHelper.ajax({url:"https://mb3admin.com/admin/service/registration/getStatus",type:"POST",data:postData,contentType:"application/x-www-form-urlencoded",dataType:"json"})}function getSubscriptionHtml(subs,key){return subs.map(function(item){var itemHtml="",makeLink=item.autoRenew&&"Stripe"==item.store,tagName=makeLink?"button":"div";return itemHtml+=(tagName='<button type="button"')+' class="listItem listItem-button listItem-noborder'+(makeLink?" lnkSubscription":"")+'" data-feature="'+item.feature+'" data-key="'+key+'">',itemHtml+='<i class="listItemIcon md-icon">dvr</i>',itemHtml+='<div class="listItemBody two-line">',itemHtml+='<div class="listItemBodyText">',itemHtml+=globalize.translate("ListItemPremiereSub",item.planType,item.expDate,item.store),itemHtml+="</div>",itemHtml+='<div class="listItemBodyText secondary">',itemHtml+=globalize.translate("Stripe"==item.store?item.autoRenew?"LabelClickToCancel":"LabelAlreadyCancelled":"LabelCancelInfo",item.store),itemHtml+="</div>",itemHtml+="</div>",itemHtml+="</"+tagName+">"})}function cancelSub(e){console.log("Cancel ");var feature=this.getAttribute("data-feature"),key=this.getAttribute("data-key");confirm({title:globalize.translate("HeaderCancelSub"),text:globalize.translate("MessageConfirmSubCancel"),confirmText:globalize.translate("ButtonCancelSub"),cancelText:globalize.translate("ButtonDontCancelSub"),primary:"cancel"}).then(function(){console.log("after confirm");var postData="key="+key+"&feature="+feature;fetchHelper.ajax({url:"https://mb3admin.com/admin/service/stripe/requestSubCancel",type:"POST",data:postData,contentType:"application/x-www-form-urlencoded"}).then(function(response){alertText({text:globalize.translate("MessageSubCancelReqSent"),title:globalize.translate("HeaderConfirmation")})},function(response){alertText({text:globalize.translate("MessageSubCancelError","cancel@emby.media")})})})}function retrieveSupporterKey(e){loading.show();var form=this,email=form.querySelector("#txtEmail").value,url="https://mb3admin.com/admin/service/supporter/retrievekey?email="+email;return console.log(url),fetchHelper.ajax({url:url,type:"POST",dataType:"json"}).then(function(result){loading.hide(),result.Success?require(["toast"],function(toast){toast(globalize.translate("MessageKeyEmailedTo").replace("{0}",email))}):require(["toast"],function(toast){toast(result.ErrorMessage)}),console.log(result)}),e.preventDefault(),!1}function alertText(options){require(["alert"],function(alert){alert(options)})}function updateSupporterKey(e){loading.show();var form=this,key=form.querySelector("#txtSupporterKey").value,info={SupporterKey:key};return ApiClient.updatePluginSecurityInfo(info).then(function(){loading.hide(),alertText(key?{text:globalize.translate("MessageKeyUpdated"),title:globalize.translate("HeaderConfirmation")}:{text:globalize.translate("MessageKeyRemoved"),title:globalize.translate("HeaderConfirmation")}),connectionManager.resetRegistrationInfo(ApiClient),load(dom.parentWithClass(form,"page"))},function(){loading.hide(),connectionManager.resetRegistrationInfo(ApiClient),load(dom.parentWithClass(form,"page"))}),e.preventDefault(),!1}function onSupporterLinkClick(e){registrationServices.showPremiereInfo(),e.preventDefault(),e.stopPropagation()}return function(view,params){view.querySelector("#supporterKeyForm").addEventListener("submit",updateSupporterKey),view.querySelector("#lostKeyForm").addEventListener("submit",retrieveSupporterKey),view.querySelector(".benefits").innerHTML=globalize.translate("HeaderSupporterBenefit",'<a is="emby-linkbutton" class="lnkPremiere button-link" href="http://emby.media/premiere" target="_blank">',"</a>"),view.querySelector(".lnkPremiere").addEventListener("click",onSupporterLinkClick),view.addEventListener("viewshow",function(){load(this)})}});