//myproduction-change-start
//Added jQuery
define(["appSettings", "userSettings", "dom", "browser", "datetime", "appRouter", "events", "scrollStyles", "jQuery"], function(appSettings, userSettings, dom, browser, datetime, appRouter, events, scrollStyles, jQuery) {
//myproduction-change-end
    "use strict";
    var libraryBrowser = {
        getDefaultPageSize: function(key, defaultValue) {
            return 100
        },
        getSavedQueryKey: function(modifier) {
            return window.location.href.split("#")[0] + (modifier || "")
        },
        loadSavedQueryValues: function(key, query) {
            var values = userSettings.get(key);
            return values ? (values = JSON.parse(values), Object.assign(query, values)) : query
        },
        saveQueryValues: function(key, query) {
            var values = {};
            query.SortBy && (values.SortBy = query.SortBy), query.SortOrder && (values.SortOrder = query.SortOrder), userSettings.set(key, JSON.stringify(values))
        },
        saveViewSetting: function(key, value) {
            userSettings.set(key + "-_view", value)
        },
        getSavedView: function(key) {
            return userSettings.get(key + "-_view")
        },
        getSavedViewSetting: function(key) {
            return new Promise(function(resolve, reject) {
                resolve(libraryBrowser.getSavedView(key))
            })
        },
        showLayoutMenu: function(button, currentLayout, views) {
            var dispatchEvent = !0;
            views || (dispatchEvent = !1, views = button.getAttribute("data-layouts"), views = views ? views.split(",") : ["List", "Poster", "PosterCard", "Thumb", "ThumbCard"]);
            var menuItems = views.map(function(v) {
                return {
                    name: Globalize.translate("Option" + v),
                    id: v,
                    selected: currentLayout == v
                }
            });
            require(["actionsheet"], function(actionsheet) {
                actionsheet.show({
                    items: menuItems,
                    positionTo: button,
                    callback: function(id) {
                        button.dispatchEvent(new CustomEvent("layoutchange", {
                            detail: {
                                viewStyle: id
                            },
                            bubbles: !0,
                            cancelable: !1
                        })), dispatchEvent || window.$ && $(button).trigger("layoutchange", [id])
                    }
                })
            })
        },
        getQueryPagingHtml: function(options) {
            var startIndex = options.startIndex,
                limit = options.limit,
                totalRecordCount = options.totalRecordCount,
                html = "",
                recordsEnd = Math.min(startIndex + limit, totalRecordCount),
                showControls = limit < totalRecordCount;
            if (html += '<div class="listPaging">', showControls) {
                html += '<span style="vertical-align:middle;">';
                html += (totalRecordCount ? startIndex + 1 : 0) + "-" + recordsEnd + " of " + totalRecordCount, html += "</span>"
            }
            return (showControls || options.viewButton || options.filterButton || options.sortButton || options.addLayoutButton) && (html += '<div style="display:inline-block;">', showControls && (html += '<button is="paper-icon-button-light" class="btnPreviousPage autoSize" ' + (startIndex ? "" : "disabled") + '><i class="md-icon">&#xE5C4;</i></button>', html += '<button is="paper-icon-button-light" class="btnNextPage autoSize" ' + (startIndex + limit >= totalRecordCount ? "disabled" : "") + '><i class="md-icon">&#xE5C8;</i></button>'), options.addLayoutButton && (html += '<button is="paper-icon-button-light" title="' + Globalize.translate("ButtonSelectView") + '" class="btnChangeLayout autoSize" data-layouts="' + (options.layouts || "") + '" onclick="LibraryBrowser.showLayoutMenu(this, \'' + (options.currentLayout || "") + '\');"><i class="md-icon">&#xE42A;</i></button>'), options.sortButton && (html += '<button is="paper-icon-button-light" class="btnSort autoSize" title="' + Globalize.translate("ButtonSort") + '"><i class="md-icon">&#xE053;</i></button>'), options.filterButton && (html += '<button is="paper-icon-button-light" class="btnFilter autoSize" title="' + Globalize.translate("ButtonFilter") + '"><i class="md-icon">&#xE152;</i></button>'), html += "</div>"), html += "</div>"
        },
        showSortMenu: function(options) {
            require(["dialogHelper", "emby-radio"], function(dialogHelper) {
                function onSortByChange() {
                    var newValue = this.value;
                    if (this.checked) {
                        var changed = options.query.SortBy != newValue;
                        options.query.SortBy = newValue.replace("_", ","), options.query.StartIndex = 0, options.callback && changed && options.callback()
                    }
                }

                function onSortOrderChange() {
                    var newValue = this.value;
                    if (this.checked) {
                        var changed = options.query.SortOrder != newValue;
                        options.query.SortOrder = newValue, options.query.StartIndex = 0, options.callback && changed && options.callback()
                    }
                }
                var dlg = dialogHelper.createDialog({
                    removeOnClose: !0,
                    modal: !1,
                    entryAnimationDuration: 160,
                    exitAnimationDuration: 200
                });
                dlg.classList.add("ui-body-a"), dlg.classList.add("background-theme-a"), dlg.classList.add("formDialog");
                var html = "";
                html += '<div style="margin:0;padding:1.25em 1.5em 1.5em;">', html += '<h2 style="margin:0 0 .5em;">', html += Globalize.translate("HeaderSortBy"), html += "</h2>";
                var i, length, isChecked;
                for (html += "<div>", i = 0, length = options.items.length; i < length; i++) {
                    var option = options.items[i],
                        radioValue = option.id.replace(",", "_");
                    isChecked = (options.query.SortBy || "").replace(",", "_") == radioValue ? " checked" : "", html += '<label class="radio-label-block"><input type="radio" is="emby-radio" name="SortBy" data-id="' + option.id + '" value="' + radioValue + '" class="menuSortBy" ' + isChecked + " /><span>" + option.name + "</span></label>"
                }
                html += "</div>", html += '<h2 style="margin: 1em 0 .5em;">', html += Globalize.translate("HeaderSortOrder"), html += "</h2>", html += "<div>", isChecked = "Ascending" == options.query.SortOrder ? " checked" : "", html += '<label class="radio-label-block"><input type="radio" is="emby-radio" name="SortOrder" value="Ascending" class="menuSortOrder" ' + isChecked + " /><span>" + Globalize.translate("OptionAscending") + "</span></label>", isChecked = "Descending" == options.query.SortOrder ? " checked" : "", html += '<label class="radio-label-block"><input type="radio" is="emby-radio" name="SortOrder" value="Descending" class="menuSortOrder" ' + isChecked + " /><span>" + Globalize.translate("OptionDescending") + "</span></label>", html += "</div>", html += "</div>", dlg.innerHTML = html, dialogHelper.open(dlg);
                var sortBys = dlg.querySelectorAll(".menuSortBy");
                for (i = 0, length = sortBys.length; i < length; i++) sortBys[i].addEventListener("change", onSortByChange);
                var sortOrders = dlg.querySelectorAll(".menuSortOrder");
                for (i = 0, length = sortOrders.length; i < length; i++) sortOrders[i].addEventListener("change", onSortOrderChange)
            })
        },
        renderDetailImage: function(page, elem, item, apiClient, editable, imageLoader, indicators) {
            "SeriesTimer" !== item.Type && "Program" !== item.Type || (editable = !1), "Person" !== item.Type ? (elem.classList.add("detailimg-hidemobile"), page.querySelector(".detailPageContent").classList.add("detailPageContent-nodetailimg")) : page.querySelector(".detailPageContent").classList.remove("detailPageContent-nodetailimg");
            var imageTags = item.ImageTags || {};
            item.PrimaryImageTag && (imageTags.Primary = item.PrimaryImageTag);
            var url, html = "",
                shape = "portrait",
                detectRatio = !1;
            imageTags.Primary ? (url = apiClient.getScaledImageUrl(item.Id, {
                type: "Primary",
                maxHeight: 360,
                tag: item.ImageTags.Primary
            }), detectRatio = !0) : item.BackdropImageTags && item.BackdropImageTags.length ? (url = apiClient.getScaledImageUrl(item.Id, {
                type: "Backdrop",
                maxHeight: 360,
                tag: item.BackdropImageTags[0]
            }), shape = "thumb") : imageTags.Thumb ? (url = apiClient.getScaledImageUrl(item.Id, {
                type: "Thumb",
                maxHeight: 360,
                tag: item.ImageTags.Thumb
            }), shape = "thumb") : imageTags.Disc ? (url = apiClient.getScaledImageUrl(item.Id, {
                type: "Disc",
                maxHeight: 360,
                tag: item.ImageTags.Disc
            }), shape = "square") : item.AlbumId && item.AlbumPrimaryImageTag ? (url = apiClient.getScaledImageUrl(item.AlbumId, {
                type: "Primary",
                maxHeight: 360,
                tag: item.AlbumPrimaryImageTag
            }), shape = "square") : item.SeriesId && item.SeriesPrimaryImageTag ? url = apiClient.getScaledImageUrl(item.SeriesId, {
                type: "Primary",
                maxHeight: 360,
                tag: item.SeriesPrimaryImageTag
            }) : item.ParentPrimaryImageItemId && item.ParentPrimaryImageTag && (url = apiClient.getScaledImageUrl(item.ParentPrimaryImageItemId, {
                type: "Primary",
                maxHeight: 360,
                tag: item.ParentPrimaryImageTag
            })), html += '<div style="position:relative;">', editable && (html += "<a class='itemDetailGalleryLink' is='emby-linkbutton' style='display:block;padding:2px;margin:0;' href='#'>"), detectRatio && item.PrimaryImageAspectRatio && (item.PrimaryImageAspectRatio >= 1.48 ? shape = "thumb" : item.PrimaryImageAspectRatio >= .85 && item.PrimaryImageAspectRatio <= 1.34 && (shape = "square")), html += "<img class='itemDetailImage lazy' src='css/images/empty.png' />", editable && (html += "</a>");
            var progressHtml = item.IsFolder || !item.UserData ? "" : indicators.getProgressBarHtml(item);
            if (html += '<div class="detailImageProgressContainer">', progressHtml && (html += progressHtml), html += "</div>", html += "</div>", elem.innerHTML = html, "thumb" == shape ? (elem.classList.add("thumbDetailImageContainer"), elem.classList.remove("portraitDetailImageContainer"), elem.classList.remove("squareDetailImageContainer")) : "square" == shape ? (elem.classList.remove("thumbDetailImageContainer"), elem.classList.remove("portraitDetailImageContainer"), elem.classList.add("squareDetailImageContainer")) : (elem.classList.remove("thumbDetailImageContainer"), elem.classList.add("portraitDetailImageContainer"), elem.classList.remove("squareDetailImageContainer")), url) {
                var img = elem.querySelector("img");
                img.onload = function() {
                    -1 == img.src.indexOf("empty.png") && img.classList.add("loaded")
                }, imageLoader.lazyImage(img, url)
            }
        },
        renderDetailPageBackdrop: function(page, item, apiClient, imageLoader, indicators) {
            var imgUrl, screenWidth = screen.availWidth,
                hasbackdrop = !1,
                itemBackdropElement = page.querySelector("#itemBackdrop"),
                usePrimaryImage = "Video" === item.MediaType && "Movie" !== item.Type && "Trailer" !== item.Type || item.MediaType && "Video" !== item.MediaType;
            return "Program" === item.Type && item.ImageTags && item.ImageTags.Thumb ? (imgUrl = apiClient.getScaledImageUrl(item.Id, {
                type: "Thumb",
                index: 0,
                maxWidth: screenWidth,
                tag: item.ImageTags.Thumb
            }), itemBackdropElement.classList.remove("noBackdrop"), imageLoader.lazyImage(itemBackdropElement, imgUrl, !1), hasbackdrop = !0) : usePrimaryImage && item.ImageTags && item.ImageTags.Primary ? (imgUrl = apiClient.getScaledImageUrl(item.Id, {
                type: "Primary",
                index: 0,
                maxWidth: screenWidth,
                tag: item.ImageTags.Primary
            }), itemBackdropElement.classList.remove("noBackdrop"), imageLoader.lazyImage(itemBackdropElement, imgUrl, !1), hasbackdrop = !0) : item.BackdropImageTags && item.BackdropImageTags.length ? (imgUrl = apiClient.getScaledImageUrl(item.Id, {
                type: "Backdrop",
                index: 0,
                maxWidth: screenWidth,
                tag: item.BackdropImageTags[0]
            }), itemBackdropElement.classList.remove("noBackdrop"), imageLoader.lazyImage(itemBackdropElement, imgUrl, !1), hasbackdrop = !0) : item.ParentBackdropItemId && item.ParentBackdropImageTags && item.ParentBackdropImageTags.length ? (imgUrl = apiClient.getScaledImageUrl(item.ParentBackdropItemId, {
                type: "Backdrop",
                index: 0,
                tag: item.ParentBackdropImageTags[0],
                maxWidth: screenWidth
            }), itemBackdropElement.classList.remove("noBackdrop"), imageLoader.lazyImage(itemBackdropElement, imgUrl, !1), hasbackdrop = !0) : item.ImageTags && item.ImageTags.Thumb ? (imgUrl = apiClient.getScaledImageUrl(item.Id, {
                type: "Thumb",
                index: 0,
                maxWidth: screenWidth,
                tag: item.ImageTags.Thumb
            }), itemBackdropElement.classList.remove("noBackdrop"), imageLoader.lazyImage(itemBackdropElement, imgUrl, !1), hasbackdrop = !0) : (itemBackdropElement.classList.add("noBackdrop"), itemBackdropElement.style.backgroundImage = ""), hasbackdrop
        },
		//myproduction-change-start
		//Added functions
		ExecuteItemDetailsPageDownload: function () {
			var itemId = getParameterByName("id");

			if (itemId != null) {
				var piwikTracker = Piwik.getAsyncTracker();
				piwikTracker.trackEvent("MediaAccess", "DownloadedItem", document.title);

				var accessToken = ApiClient.accessToken();
				var downloadUrl = ApiClient.getUrl("Items/" + itemId + "/Download?api_key=" + accessToken);
				setTimeout(function () {
					window.location.href = downloadUrl;
				}, 500);
			}
		},

		ExecuteItemDetailsPageExternalStream: function () {
			var itemId = getParameterByName("id");

			if (itemId != null) {
				var accessToken = ApiClient.accessToken();
				var deviceId = ApiClient.deviceId();

				var logActivityUrl = ApiClient.getUrl("Items/" + itemId + "/NotifyStreamedExternalInPlayer?api_key=" + accessToken);
				jQuery.ajax(
					{
						url: logActivityUrl,
						type: 'GET'
					});

				var piwikTracker = Piwik.getAsyncTracker();
				piwikTracker.trackEvent("MediaAccess", "StreamedItemInExternalPlayer", document.title);

				var downloadUrl = ApiClient.getUrl("Videos/" + itemId + "/stream?static=true&mediaSourceId=" + itemId + "&deviceId=" + deviceId + "&api_key=" + accessToken);
				setTimeout(function () {
					window.location.href = downloadUrl;
				}, 500);
			}
		}
		//myproduction-change-end
    };
    return window.LibraryBrowser = libraryBrowser, libraryBrowser
});