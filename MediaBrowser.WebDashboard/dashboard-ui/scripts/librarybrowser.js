//myproduction-change-start
//Added jQuery
define(["appSettings", "dom", "browser", "datetime", "embyRouter", "events", "scrollStyles", "jQuery"], function (appSettings, dom, browser, datetime, embyRouter, events, scrollStyles, jQuery) {
//myproduction-change-end
	"use strict";

	function fadeInRight(elem) {
		var pct = browser.mobile ? "4%" : "0.5%",
			keyframes = [{
				opacity: "0",
				transform: "translate3d(" + pct + ", 0, 0)",
				offset: 0
			}, {
				opacity: "1",
				transform: "none",
				offset: 1
			}];
		elem.animate(keyframes, {
			duration: 160,
			iterations: 1,
			easing: "ease-out"
		})
	}
	var pageSizeKey = "pagesize_v4",
		libraryBrowser = {
			getDefaultPageSize: function (key, defaultValue) {
				return 100
			},
			getSavedQueryKey: function (modifier) {
				return window.location.href.split("#")[0] + (modifier || "")
			},
			loadSavedQueryValues: function (key, query) {
				var values = appSettings.get(key + "_" + Dashboard.getCurrentUserId());
				return values ? (values = JSON.parse(values), Object.assign(query, values)) : query
			},
			saveQueryValues: function (key, query) {
				var values = {};
				query.SortBy && (values.SortBy = query.SortBy), query.SortOrder && (values.SortOrder = query.SortOrder);
				try {
					appSettings.set(key + "_" + Dashboard.getCurrentUserId(), JSON.stringify(values))
				} catch (e) { }
			},
			saveViewSetting: function (key, value) {
				try {
					appSettings.set(key + "_" + Dashboard.getCurrentUserId() + "_view", value)
				} catch (e) { }
			},
			getSavedView: function (key) {
				var val = appSettings.get(key + "_" + Dashboard.getCurrentUserId() + "_view");
				return val
			},
			getSavedViewSetting: function (key) {
				return new Promise(function (resolve, reject) {
					var val = libraryBrowser.getSavedView(key);
					resolve(val)
				})
			},
			allowSwipe: function (target) {
				function allowSwipeOn(elem) {
					return !dom.parentWithTag(elem, "input") && (!elem.classList || !elem.classList.contains("hiddenScrollX") && !elem.classList.contains("smoothScrollX") && !elem.classList.contains("animatedScrollX"))
				}
				for (var parent = target; null != parent;) {
					if (!allowSwipeOn(parent)) return !1;
					parent = parent.parentNode
				}
				return !0
			},
			configureSwipeTabs: function (ownerpage, tabs) {
				if (browser.touch) {
					var onSwipeLeft = (ownerpage.querySelectorAll(".pageTabContent").length, function (e, target) {
						libraryBrowser.allowSwipe(target) && ownerpage.contains(target) && tabs.selectNext()
					}),
						onSwipeRight = function (e, target) {
							libraryBrowser.allowSwipe(target) && ownerpage.contains(target) && tabs.selectPrevious()
						};
					require(["touchHelper"], function (TouchHelper) {
						var touchHelper = new TouchHelper(ownerpage.parentNode.parentNode);
						events.on(touchHelper, "swipeleft", onSwipeLeft), events.on(touchHelper, "swiperight", onSwipeRight), ownerpage.addEventListener("viewdestroy", function () {
							touchHelper.destroy()
						})
					})
				}
			},
			configurePaperLibraryTabs: function (ownerpage, tabs, panels, animateTabs, enableSwipe) {
				enableSwipe !== !1 && libraryBrowser.configureSwipeTabs(ownerpage, tabs), tabs.addEventListener("beforetabchange", function (e) {
					null != e.detail.previousIndex && panels[e.detail.previousIndex].classList.remove("is-active");
					var newPanel = panels[e.detail.selectedTabIndex];
					null != e.detail.previousIndex && e.detail.previousIndex != e.detail.selectedTabIndex && newPanel.animate && (animateTabs || []).indexOf(e.detail.selectedTabIndex) != -1 && fadeInRight(newPanel), newPanel.classList.add("is-active")
				})
			},
			getArtistLinksHtml: function (artists, cssClass) {
				var html = [];
				cssClass = cssClass ? cssClass + " button-link" : "button-link";
				for (var i = 0, length = artists.length; i < length; i++) {
					var artist = artists[i],
						css = cssClass ? ' class="' + cssClass + '"' : "";
					html.push("<a" + css + ' is="emby-linkbutton" href="itemdetails.html?id=' + artist.Id + '">' + artist.Name + "</a>")
				}
				return html = html.join(" / ")
			},
			getListItemInfo: function (elem) {
				for (var elemWithAttributes = elem; !elemWithAttributes.getAttribute("data-id");) elemWithAttributes = elemWithAttributes.parentNode;
				var itemId = elemWithAttributes.getAttribute("data-id"),
					index = elemWithAttributes.getAttribute("data-index"),
					mediaType = elemWithAttributes.getAttribute("data-mediatype");
				return {
					id: itemId,
					index: index,
					mediaType: mediaType,
					context: elemWithAttributes.getAttribute("data-context")
				}
			},
			renderName: function (item, nameElem, linkToElement, context) {
				require(["itemHelper"], function (itemHelper) {
					var name = itemHelper.getDisplayName(item, {
						includeParentInfo: !1
					});
					linkToElement ? nameElem.innerHTML = '<a class="detailPageParentLink button-link" is="emby-linkbutton" href="' + embyRouter.getRouteUrl(item, {
						context: context
					}) + '">' + name + "</a>" : nameElem.innerHTML = name
				})
			},
			renderParentName: function (item, parentNameElem, context) {
				var html = [],
					contextParam = context ? "&context=" + context : "";
				item.AlbumArtists ? html.push(libraryBrowser.getArtistLinksHtml(item.AlbumArtists, "detailPageParentLink")) : item.ArtistItems && item.ArtistItems.length && "MusicVideo" == item.Type ? html.push(libraryBrowser.getArtistLinksHtml(item.ArtistItems, "detailPageParentLink")) : item.SeriesName && "Episode" == item.Type && html.push('<a class="detailPageParentLink button-link" is="emby-linkbutton" href="itemdetails.html?id=' + item.SeriesId + contextParam + '">' + item.SeriesName + "</a>"), item.SeriesName && "Season" == item.Type ? html.push('<a class="detailPageParentLink button-link" is="emby-linkbutton" href="itemdetails.html?id=' + item.SeriesId + contextParam + '">' + item.SeriesName + "</a>") : null != item.ParentIndexNumber && "Episode" == item.Type ? html.push('<a class="detailPageParentLink button-link" is="emby-linkbutton" href="itemdetails.html?id=' + item.SeasonId + contextParam + '">' + item.SeasonName + "</a>") : item.Album && "Audio" == item.Type && (item.AlbumId || item.ParentId) ? html.push('<a class="detailPageParentLink button-link" is="emby-linkbutton" href="itemdetails.html?id=' + (item.AlbumId || item.ParentId) + contextParam + '">' + item.Album + "</a>") : item.Album && "MusicVideo" == item.Type && item.AlbumId ? html.push('<a class="detailPageParentLink button-link" is="emby-linkbutton" href="itemdetails.html?id=' + item.AlbumId + contextParam + '">' + item.Album + "</a>") : item.Album ? html.push(item.Album) : (item.IsSeries || item.EpisodeTitle) && html.push(item.Name), html.length ? (parentNameElem.classList.remove("hide"), parentNameElem.innerHTML = html.join(" - ")) : parentNameElem.classList.add("hide")
			},
			showLayoutMenu: function (button, currentLayout, views) {
				var dispatchEvent = !0;
				views || (dispatchEvent = !1, views = button.getAttribute("data-layouts"), views = views ? views.split(",") : ["List", "Poster", "PosterCard", "Thumb", "ThumbCard"]);
				var menuItems = views.map(function (v) {
					return {
						name: Globalize.translate("Option" + v),
						id: v,
						selected: currentLayout == v
					}
				});
				require(["actionsheet"], function (actionsheet) {
					actionsheet.show({
						items: menuItems,
						positionTo: button,
						callback: function (id) {
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
			getQueryPagingHtml: function (options) {
				var startIndex = options.startIndex,
					limit = options.limit,
					totalRecordCount = options.totalRecordCount;
				if (limit && options.updatePageSizeSetting !== !1) try {
					appSettings.set(options.pageSizeKey || pageSizeKey, limit)
				} catch (e) { }
				var html = "",
					recordsEnd = Math.min(startIndex + limit, totalRecordCount),
					showControls = limit < totalRecordCount;
				if (html += '<div class="listPaging">', showControls) {
					html += '<span style="vertical-align:middle;">';
					var startAtDisplay = totalRecordCount ? startIndex + 1 : 0;
					html += startAtDisplay + "-" + recordsEnd + " of " + totalRecordCount, html += "</span>"
				}
				return (showControls || options.viewButton || options.filterButton || options.sortButton || options.addLayoutButton) && (html += '<div style="display:inline-block;">', showControls && (html += '<button is="paper-icon-button-light" class="btnPreviousPage autoSize" ' + (startIndex ? "" : "disabled") + '><i class="md-icon">&#xE5C4;</i></button>', html += '<button is="paper-icon-button-light" class="btnNextPage autoSize" ' + (startIndex + limit >= totalRecordCount ? "disabled" : "") + '><i class="md-icon">arrow_forward</i></button>'), options.addLayoutButton && (html += '<button is="paper-icon-button-light" title="' + Globalize.translate("ButtonSelectView") + '" class="btnChangeLayout autoSize" data-layouts="' + (options.layouts || "") + '" onclick="LibraryBrowser.showLayoutMenu(this, \'' + (options.currentLayout || "") + '\');"><i class="md-icon">view_comfy</i></button>'), options.sortButton && (html += '<button is="paper-icon-button-light" class="btnSort autoSize" title="' + Globalize.translate("ButtonSort") + '"><i class="md-icon">sort_by_alpha</i></button>'), options.filterButton && (html += '<button is="paper-icon-button-light" class="btnFilter autoSize" title="' + Globalize.translate("ButtonFilter") + '"><i class="md-icon">filter_list</i></button>'), html += "</div>"), html += "</div>"
			},
			showSortMenu: function (options) {
				require(["dialogHelper", "emby-radio"], function (dialogHelper) {
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
			renderDetailImage: function (page, elem, item, editable, imageLoader, indicators) {
				var preferThumb = !1;
				"SeriesTimer" !== item.Type && "Program" !== item.Type || (editable = !1), "Person" !== item.Type ? (elem.classList.add("detailimg-hidemobile"), page.querySelector(".detailPageContent").classList.add("detailPageContent-nodetailimg")) : page.querySelector(".detailPageContent").classList.remove("detailPageContent-nodetailimg");
				var imageTags = item.ImageTags || {};
				item.PrimaryImageTag && (imageTags.Primary = item.PrimaryImageTag);
				var url, html = "",
					shape = "portrait",
					imageHeight = 360,
					detectRatio = !1;
				preferThumb && imageTags.Thumb ? (url = ApiClient.getScaledImageUrl(item.Id, {
					type: "Thumb",
					maxHeight: imageHeight,
					tag: item.ImageTags.Thumb
				}), shape = "thumb") : imageTags.Primary ? (url = ApiClient.getScaledImageUrl(item.Id, {
					type: "Primary",
					maxHeight: imageHeight,
					tag: item.ImageTags.Primary
				}), detectRatio = !0) : item.BackdropImageTags && item.BackdropImageTags.length ? (url = ApiClient.getScaledImageUrl(item.Id, {
					type: "Backdrop",
					maxHeight: imageHeight,
					tag: item.BackdropImageTags[0]
				}), shape = "thumb") : imageTags.Thumb ? (url = ApiClient.getScaledImageUrl(item.Id, {
					type: "Thumb",
					maxHeight: imageHeight,
					tag: item.ImageTags.Thumb
				}), shape = "thumb") : imageTags.Disc ? (url = ApiClient.getScaledImageUrl(item.Id, {
					type: "Disc",
					maxHeight: imageHeight,
					tag: item.ImageTags.Disc
				}), shape = "square") : item.AlbumId && item.AlbumPrimaryImageTag ? (url = ApiClient.getScaledImageUrl(item.AlbumId, {
					type: "Primary",
					maxHeight: imageHeight,
					tag: item.AlbumPrimaryImageTag
				}), shape = "square") : item.SeriesId && item.SeriesPrimaryImageTag ? url = ApiClient.getScaledImageUrl(item.SeriesId, {
					type: "Primary",
					maxHeight: imageHeight,
					tag: item.SeriesPrimaryImageTag
				}) : item.ParentPrimaryImageItemId && item.ParentPrimaryImageTag && (url = ApiClient.getScaledImageUrl(item.ParentPrimaryImageItemId, {
					type: "Primary",
					maxHeight: imageHeight,
					tag: item.ParentPrimaryImageTag
				})), html += '<div style="position:relative;">', editable && (html += "<a class='itemDetailGalleryLink' is='emby-linkbutton' style='display:block;padding:2px;margin:0;' href='#'>"), detectRatio && item.PrimaryImageAspectRatio && (item.PrimaryImageAspectRatio >= 1.48 ? shape = "thumb" : item.PrimaryImageAspectRatio >= .85 && item.PrimaryImageAspectRatio <= 1.34 && (shape = "square")), html += "<img class='itemDetailImage lazy' src='css/images/empty.png' />", editable && (html += "</a>");
				var progressHtml = item.IsFolder || !item.UserData ? "" : indicators.getProgressBarHtml(item);
				if (html += '<div class="detailImageProgressContainer">', progressHtml && (html += progressHtml), html += "</div>", html += "</div>", elem.innerHTML = html, "thumb" == shape ? (elem.classList.add("thumbDetailImageContainer"), elem.classList.remove("portraitDetailImageContainer"), elem.classList.remove("squareDetailImageContainer")) : "square" == shape ? (elem.classList.remove("thumbDetailImageContainer"), elem.classList.remove("portraitDetailImageContainer"), elem.classList.add("squareDetailImageContainer")) : (elem.classList.remove("thumbDetailImageContainer"), elem.classList.add("portraitDetailImageContainer"), elem.classList.remove("squareDetailImageContainer")), url) {
					var img = elem.querySelector("img");
					img.onload = function () {
						img.src.indexOf("empty.png") == -1 && img.classList.add("loaded")
					}, imageLoader.lazyImage(img, url)
				}
			},
			renderDetailPageBackdrop: function (page, item, imageLoader, indicators) {
				var imgUrl, screenWidth = screen.availWidth,
					hasbackdrop = !1,
					itemBackdropElement = page.querySelector("#itemBackdrop"),
					usePrimaryImage = "Video" === item.MediaType && "Movie" !== item.Type && "Trailer" !== item.Type || item.MediaType && "Video" !== item.MediaType,
					useThumbImage = "Program" === item.Type;
				return useThumbImage && item.ImageTags && item.ImageTags.Thumb ? (imgUrl = ApiClient.getScaledImageUrl(item.Id, {
					type: "Thumb",
					index: 0,
					maxWidth: screenWidth,
					tag: item.ImageTags.Thumb
				}), itemBackdropElement.classList.remove("noBackdrop"), imageLoader.lazyImage(itemBackdropElement, imgUrl, !1), hasbackdrop = !0) : usePrimaryImage && item.ImageTags && item.ImageTags.Primary ? (imgUrl = ApiClient.getScaledImageUrl(item.Id, {
					type: "Primary",
					index: 0,
					maxWidth: screenWidth,
					tag: item.ImageTags.Primary
				}), itemBackdropElement.classList.remove("noBackdrop"), imageLoader.lazyImage(itemBackdropElement, imgUrl, !1), hasbackdrop = !0) : item.BackdropImageTags && item.BackdropImageTags.length ? (imgUrl = ApiClient.getScaledImageUrl(item.Id, {
					type: "Backdrop",
					index: 0,
					maxWidth: screenWidth,
					tag: item.BackdropImageTags[0]
				}), itemBackdropElement.classList.remove("noBackdrop"), imageLoader.lazyImage(itemBackdropElement, imgUrl, !1), hasbackdrop = !0) : item.ParentBackdropItemId && item.ParentBackdropImageTags && item.ParentBackdropImageTags.length ? (imgUrl = ApiClient.getScaledImageUrl(item.ParentBackdropItemId, {
					type: "Backdrop",
					index: 0,
					tag: item.ParentBackdropImageTags[0],
					maxWidth: screenWidth
				}), itemBackdropElement.classList.remove("noBackdrop"), imageLoader.lazyImage(itemBackdropElement, imgUrl, !1), hasbackdrop = !0) : item.ImageTags && item.ImageTags.Thumb ? (imgUrl = ApiClient.getScaledImageUrl(item.Id, {
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