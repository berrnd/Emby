define(["loading", "embyRouter", "layoutManager", "connectionManager", "cardBuilder", "datetime", "mediaInfo", "backdrop", "listView", "itemContextMenu", "itemHelper", "dom", "indicators", "apphost", "imageLoader", "libraryMenu", "globalize", "browser", "events", "scrollHelper", "playbackManager", "libraryBrowser", "scrollStyles", "emby-itemscontainer", "emby-checkbox", "emby-linkbutton", "emby-playstatebutton", "emby-ratingbutton", "emby-downloadbutton"], function (loading, embyRouter, layoutManager, connectionManager, cardBuilder, datetime, mediaInfo, backdrop, listView, itemContextMenu, itemHelper, dom, indicators, appHost, imageLoader, libraryMenu, globalize, browser, events, scrollHelper, playbackManager, libraryBrowser) {
	"use strict";

	function getPromise(params) {
		var id = params.id;
		if (id) return ApiClient.getItem(Dashboard.getCurrentUserId(), id);
		if (params.seriesTimerId) return ApiClient.getLiveTvSeriesTimer(params.seriesTimerId);
		var name = params.genre;
		if (name) return ApiClient.getGenre(name, Dashboard.getCurrentUserId());
		if (name = params.musicgenre) return ApiClient.getMusicGenre(name, Dashboard.getCurrentUserId());
		if (name = params.gamegenre) return ApiClient.getGameGenre(name, Dashboard.getCurrentUserId());
		if (name = params.musicartist) return ApiClient.getArtist(name, Dashboard.getCurrentUserId());
		throw new Error("Invalid request")
	}

	function hideAll(page, className, show) {
		var i, length, elems = page.querySelectorAll("." + className);
		for (i = 0, length = elems.length; i < length; i++) show ? elems[i].classList.remove("hide") : elems[i].classList.add("hide")
	}

	function getContextMenuOptions(item, user, button) {
		var options = {
			item: item,
			open: !1,
			play: !1,
			playAllFromHere: !1,
			queueAllFromHere: !1,
			positionTo: button,
			cancelTimer: !1,
			record: !1,
			deleteItem: item.IsFolder === !0,
			shuffle: !1,
			instantMix: !1,
			user: user
		};
		return appHost.supports("sync") && (options.syncLocal = !1), options
	}

	function renderSyncLocalContainer(page, params, user, item) {
		if (appHost.supports("sync"))
			for (var canSync = itemHelper.canSync(user, item), buttons = page.querySelectorAll(".btnSyncDownload"), i = 0, length = buttons.length; i < length; i++) buttons[i].setItem(item), canSync ? buttons[i].classList.remove("hide") : buttons[i].classList.add("hide")
	}

	function getProgramScheduleHtml(items, options) {
		options = options || {};
		var html = "";
		return html += '<div is="emby-itemscontainer" class="itemsContainer vertical-list" data-contextmenu="false">', html += listView.getListViewHtml({
			items: items,
			enableUserDataButtons: !1,
			image: !1,
			showProgramDateTime: !0,
			showChannel: !0,
			mediaInfo: !1,
			action: "none",
			moreButton: !1,
			recordButton: !1
		}), html += "</div>"
	}

	function renderSeriesTimerSchedule(page, seriesTimerId) {
		ApiClient.getLiveTvTimers({
			UserId: ApiClient.getCurrentUserId(),
			ImageTypeLimit: 1,
			EnableImageTypes: "Primary,Backdrop,Thumb",
			SortBy: "StartDate",
			EnableTotalRecordCount: !1,
			EnableUserData: !1,
			SeriesTimerId: seriesTimerId,
			Fields: "ChannelInfo"
		}).then(function (result) {
			result.Items.length && result.Items[0].SeriesTimerId != seriesTimerId && (result.Items = []);
			var html = getProgramScheduleHtml(result.Items),
				scheduleTab = page.querySelector(".seriesTimerSchedule");
			scheduleTab.innerHTML = html, imageLoader.lazyChildren(scheduleTab)
		})
	}

	function renderSeriesTimerEditor(page, item, user) {
		if ("SeriesTimer" === item.Type) {
			if (!user.Policy.EnableLiveTvManagement) return page.querySelector(".seriesTimerScheduleSection").classList.add("hide"), void hideAll(page, "btnCancelSeriesTimer");
			require(["seriesRecordingEditor"], function (seriesRecordingEditor) {
				seriesRecordingEditor.embed(item, ApiClient.serverId(), {
					context: page.querySelector(".seriesRecordingEditor")
				})
			}), page.querySelector(".seriesTimerScheduleSection").classList.remove("hide"), hideAll(page, "btnCancelSeriesTimer", !0), renderSeriesTimerSchedule(page, item.Id)
		}
	}

	function reloadPlayButtons(page, item) {
		var canPlay = !1;
		if ("Program" == item.Type) {
			var now = new Date;
			now >= datetime.parseISO8601Date(item.StartDate, !0) && now < datetime.parseISO8601Date(item.EndDate, !0) ? (hideAll(page, "btnPlay", !0), canPlay = !0) : hideAll(page, "btnPlay"), hideAll(page, "btnResume"), hideAll(page, "btnInstantMix"), hideAll(page, "btnShuffle")
		} else if (playbackManager.canPlay(item)) {
			hideAll(page, "btnPlay", !0);
			var enableInstantMix = ["Audio", "MusicAlbum", "MusicGenre", "MusicArtist"].indexOf(item.Type) !== -1;
			hideAll(page, "btnInstantMix", enableInstantMix);
			var enableShuffle = item.IsFolder || ["MusicAlbum", "MusicGenre", "MusicArtist"].indexOf(item.Type) !== -1;
			hideAll(page, "btnShuffle", enableShuffle), canPlay = !0, hideAll(page, "btnResume", item.UserData && item.UserData.PlaybackPositionTicks > 0)
		} else hideAll(page, "btnPlay"), hideAll(page, "btnResume"), hideAll(page, "btnInstantMix"), hideAll(page, "btnShuffle");
		return canPlay
	}

	function reloadUserDataButtons(page, item) {
		var i, length, btnPlaystates = page.querySelectorAll(".btnPlaystate");
		for (i = 0, length = btnPlaystates.length; i < length; i++) {
			var btnPlaystate = btnPlaystates[i];
			itemHelper.canMarkPlayed(item) ? (btnPlaystate.classList.remove("hide"), btnPlaystate.setItem(item)) : (btnPlaystate.classList.add("hide"), btnPlaystate.setItem(null));
			var textElem = btnPlaystate.querySelector(".detailButton-mobile-text");
			textElem && (textElem.innerHTML = btnPlaystate.title)
		}
		var btnUserRatings = page.querySelectorAll(".btnUserRating");
		for (i = 0, length = btnUserRatings.length; i < length; i++) {
			var btnUserRating = btnUserRatings[i];
			itemHelper.canRate(item) ? (btnUserRating.classList.remove("hide"), btnUserRating.setItem(item)) : (btnUserRating.classList.add("hide"), btnUserRating.setItem(null));
			var textElem = btnUserRating.querySelector(".detailButton-mobile-text");
			textElem && (textElem.innerHTML = btnUserRating.title)
		}
	}

	function reloadFromItem(instance, page, params, item, user) {
		currentItem = item;
		var context = params.context;
		libraryBrowser.renderName(item, page.querySelector(".itemName"), !1, context), libraryBrowser.renderParentName(item, page.querySelector(".parentName"), context), libraryMenu.setTitle(""), window.scrollTo(0, 0), renderSeriesTimerEditor(page, item, user), renderImage(page, item, user), renderLogo(page, item, ApiClient), setInitialCollapsibleState(page, item, context, user), renderDetails(page, item, context), dom.getWindowSize().innerWidth >= 800 ? backdrop.setBackdrops([item]) : backdrop.clear(), libraryBrowser.renderDetailPageBackdrop(page, item, imageLoader, indicators), libraryMenu.setTransparentMenu(!0);
		var canPlay = reloadPlayButtons(page, item),
			hasAnyButton = canPlay;
		item.LocalTrailerCount || item.RemoteTrailers && item.RemoteTrailers.length ? (hideAll(page, "btnPlayTrailer", !0), hasAnyButton = !0) : hideAll(page, "btnPlayTrailer"), item.CanDelete && !item.IsFolder ? (hideAll(page, "btnDeleteItem", !0), hasAnyButton = !0) : hideAll(page, "btnDeleteItem"), renderSyncLocalContainer(page, params, user, item), hasAnyButton || "Program" !== item.Type ? hideAll(page, "mainDetailButtons", !0) : hideAll(page, "mainDetailButtons"), showRecordingFields(instance, page, item, user);

		//myproduction-change-start
		//Added download and stream in external player button
		if (item.CanDownload) {
			$('.btnDownload', page).removeClass('hide');
			$('.btnStreamExternal', page).removeClass('hide');
		} else {
			$('.btnDownload', page).addClass('hide');
			$('.btnStreamExternal', page).addClass('hide');
		}
		//myproduction-change-end

		var groupedVersions = (item.MediaSources || []).filter(function (g) {
			return "Grouping" == g.Type
		});
		user.Policy.IsAdministrator && groupedVersions.length ? page.querySelector(".splitVersionContainer").classList.remove("hide") : page.querySelector(".splitVersionContainer").classList.add("hide");
		var commands = itemContextMenu.getCommands(getContextMenuOptions(item, user));
		commands.length ? hideAll(page, "btnMoreCommands", !0) : hideAll(page, "btnMoreCommands");
		var itemBirthday = page.querySelector("#itemBirthday");
		if ("Person" == item.Type && item.PremiereDate) try {
			var birthday = datetime.parseISO8601Date(item.PremiereDate, !0).toDateString();
			itemBirthday.classList.remove("hide"), itemBirthday.innerHTML = globalize.translate("BirthDateValue").replace("{0}", birthday)
		} catch (err) {
			itemBirthday.classList.add("hide")
		} else itemBirthday.classList.add("hide");
		var itemDeathDate = page.querySelector("#itemDeathDate");
		if ("Person" == item.Type && item.EndDate) try {
			var deathday = datetime.parseISO8601Date(item.EndDate, !0).toDateString();
			itemDeathDate.classList.remove("hide"), itemDeathDate.innerHTML = globalize.translate("DeathDateValue").replace("{0}", deathday)
		} catch (err) {
			itemDeathDate.classList.add("hide")
		}
		var itemBirthLocation = page.querySelector("#itemBirthLocation");
		if ("Person" == item.Type && item.ProductionLocations && item.ProductionLocations.length) {
			var gmap = '<a is="emby-linkbutton" class="button-link textlink" target="_blank" href="https://maps.google.com/maps?q=' + item.ProductionLocations[0] + '">' + item.ProductionLocations[0] + "</a>";
			itemBirthLocation.classList.remove("hide"), itemBirthLocation.innerHTML = globalize.translate("BirthPlaceValue").replace("{0}", gmap)
		} else itemBirthLocation.classList.add("hide");
		setPeopleHeader(page, item), loading.hide()
	}

	function logoImageUrl(item, apiClient, options) {
		return options = options || {}, options.type = "Logo", item.ImageTags && item.ImageTags.Logo ? (options.tag = item.ImageTags.Logo, apiClient.getScaledImageUrl(item.Id, options)) : item.ParentLogoImageTag ? (options.tag = item.ParentLogoImageTag, apiClient.getScaledImageUrl(item.ParentLogoItemId, options)) : null
	}

	function renderLogo(page, item, apiClient) {
		var url = logoImageUrl(item, apiClient, {
			maxWidth: 300
		}),
			detailLogo = page.querySelector(".detailLogo");
		url ? (detailLogo.classList.remove("hide"), detailLogo.classList.add("lazy"), detailLogo.setAttribute("data-src", url), imageLoader.lazyImage(detailLogo)) : detailLogo.classList.add("hide")
	}

	function showRecordingFields(instance, page, item, user) {
		if (!instance.currentRecordingFields) {
			var recordingFieldsElement = page.querySelector(".recordingFields");
			"Program" == item.Type && user.Policy.EnableLiveTvManagement ? require(["recordingFields"], function (recordingFields) {
				instance.currentRecordingFields = new recordingFields({
					parent: recordingFieldsElement,
					programId: item.Id,
					serverId: item.ServerId
				}), recordingFieldsElement.classList.remove("hide")
			}) : (recordingFieldsElement.classList.add("hide"), recordingFieldsElement.innerHTML = "")
		}
	}

	function renderLinks(linksElem, item) {
		var links = [];
		if (item.HomePageUrl && links.push('<a is="emby-linkbutton" class="button-link textlink" href="' + item.HomePageUrl + '" target="_blank">' + globalize.translate("ButtonWebsite") + "</a>"), item.ExternalUrls)
			for (var i = 0, length = item.ExternalUrls.length; i < length; i++) {
				var url = item.ExternalUrls[i];
				links.push('<a is="emby-linkbutton" class="button-link textlink" href="' + url.Url + '" target="_blank">' + url.Name + "</a>")
			}
		if (links.length) {
			var html = links.join('<span class="bulletSeparator">&bull;</span>');
			linksElem.innerHTML = html, linksElem.classList.remove("hide")
		} else linksElem.classList.add("hide")
	}

	function renderImage(page, item, user) {
		var container = page.querySelector(".detailImageContainer");
		libraryBrowser.renderDetailImage(page, container, item, user.Policy.IsAdministrator && "Photo" != item.MediaType, imageLoader, indicators)
	}

	function refreshDetailImageUserData(elem, item) {
		var detailImageProgressContainer = elem.querySelector(".detailImageProgressContainer");
		detailImageProgressContainer.innerHTML = indicators.getProgressBarHtml(item)
	}

	function refreshImage(page, item, user) {
		refreshDetailImageUserData(page.querySelector(".detailImageContainer"), item)
	}

	function setPeopleHeader(page, item) {
		"Audio" == item.MediaType || "MusicAlbum" == item.Type || "Book" == item.MediaType || "Photo" == item.MediaType ? page.querySelector("#peopleHeader").innerHTML = globalize.translate("HeaderPeople") : page.querySelector("#peopleHeader").innerHTML = globalize.translate("HeaderCastAndCrew")
	}

	function renderNextUp(page, item, user) {
		var section = page.querySelector(".nextUpSection");
		return "Series" != item.Type ? void section.classList.add("hide") : void ApiClient.getNextUpEpisodes({
			SeriesId: item.Id,
			UserId: user.Id
		}).then(function (result) {
			result.Items.length ? section.classList.remove("hide") : section.classList.add("hide");
			var html = cardBuilder.getCardsHtml({
				items: result.Items,
				shape: getThumbShape(!1),
				showTitle: !0,
				displayAsSpecial: "Season" == item.Type && item.IndexNumber,
				overlayText: !0,
				lazy: !0,
				overlayPlayButton: !0
			}),
				itemsContainer = section.querySelector(".nextUpItems");
			itemsContainer.innerHTML = html, imageLoader.lazyChildren(itemsContainer)
		})
	}

	function setInitialCollapsibleState(page, item, context, user) {
		page.querySelector(".collectionItems").innerHTML = "", "TvChannel" == item.Type ? (page.querySelector("#childrenCollapsible").classList.remove("hide"), renderChannelGuide(page, item, user)) : "Playlist" == item.Type ? (page.querySelector("#childrenCollapsible").classList.remove("hide"), renderPlaylistItems(page, item, user)) : "Studio" == item.Type || "Person" == item.Type || "Genre" == item.Type || "MusicGenre" == item.Type || "GameGenre" == item.Type || "MusicArtist" == item.Type ? (page.querySelector("#childrenCollapsible").classList.remove("hide"), renderItemsByName(page, item, user)) : item.IsFolder || "Episode" == item.Type && item.SeasonId && item.SeriesId ? ("BoxSet" == item.Type && page.querySelector("#childrenCollapsible").classList.add("hide"), renderChildren(page, item)) : page.querySelector("#childrenCollapsible").classList.add("hide"), "Series" == item.Type && renderSeriesSchedule(page, item, user), "Series" == item.Type ? renderNextUp(page, item, user) : page.querySelector(".nextUpSection").classList.add("hide"), item.MediaSources && item.MediaSources.length && renderMediaSources(page, user, item), renderScenes(page, item), item.SpecialFeatureCount && 0 != item.SpecialFeatureCount && "Series" != item.Type ? (page.querySelector("#specialsCollapsible").classList.remove("hide"), renderSpecials(page, item, user, 6)) : page.querySelector("#specialsCollapsible").classList.add("hide"), item.People && item.People.length ? (page.querySelector("#castCollapsible").classList.remove("hide"), renderCast(page, item, context, enableScrollX() ? null : 12)) : page.querySelector("#castCollapsible").classList.add("hide"), item.PartCount && item.PartCount > 1 ? (page.querySelector("#additionalPartsCollapsible").classList.remove("hide"), renderAdditionalParts(page, item, user)) : page.querySelector("#additionalPartsCollapsible").classList.add("hide"), page.querySelector("#themeSongsCollapsible").classList.add("hide"), page.querySelector("#themeVideosCollapsible").classList.add("hide"), "MusicAlbum" == item.Type ? renderMusicVideos(page, item, user) : page.querySelector("#musicVideosCollapsible").classList.add("hide"), renderThemeMedia(page, item, user), enableScrollX() ? renderCriticReviews(page, item) : renderCriticReviews(page, item, 1)
	}

	function renderOverview(elems, item) {
		for (var i = 0, length = elems.length; i < length; i++) {
			var elem = elems[i],
				overview = item.Overview || "";
			if (overview) {
				elem.innerHTML = overview, elem.classList.remove("hide");
				for (var anchors = elem.querySelectorAll("a"), j = 0, length2 = anchors.length; j < length2; j++) anchors[j].setAttribute("target", "_blank")
			} else elem.innerHTML = "", elem.classList.add("hide")
		}
	}

	function renderDetails(page, item, context, isStatic) {
		renderSimilarItems(page, item, context), renderMoreFromItems(page, item);
		var taglineElement = page.querySelector(".tagline");
		item.Taglines && item.Taglines.length ? (taglineElement.classList.remove("hide"), taglineElement.innerHTML = item.Taglines[0]) : taglineElement.classList.add("hide");
		var overview = page.querySelector(".overview"),
			externalLinksElem = page.querySelector(".itemExternalLinks");
		"Season" !== item.Type && "MusicAlbum" !== item.Type && "MusicArtist" !== item.Type || (overview.classList.add("detailsHiddenOnMobile"), externalLinksElem.classList.add("detailsHiddenOnMobile")), renderOverview([overview], item);
		var i, length, itemMiscInfo = page.querySelectorAll(".itemMiscInfo-primary");
		for (i = 0, length = itemMiscInfo.length; i < length; i++) mediaInfo.fillPrimaryMediaInfo(itemMiscInfo[i], item, {
			interactive: !0,
			episodeTitle: !1
		}), itemMiscInfo[i].innerHTML ? itemMiscInfo[i].classList.remove("hide") : itemMiscInfo[i].classList.add("hide");
		for (itemMiscInfo = page.querySelectorAll(".itemMiscInfo-secondary"), i = 0, length = itemMiscInfo.length; i < length; i++) mediaInfo.fillSecondaryMediaInfo(itemMiscInfo[i], item, {
			interactive: !0
		}), itemMiscInfo[i].innerHTML ? itemMiscInfo[i].classList.remove("hide") : itemMiscInfo[i].classList.add("hide");
		var itemGenres = page.querySelectorAll(".itemGenres");
		for (i = 0, length = itemGenres.length; i < length; i++) renderGenres(itemGenres[i], item, null, isStatic);
		reloadUserDataButtons(page, item), renderStudios(page.querySelector(".itemStudios"), item, isStatic), renderLinks(externalLinksElem, item), renderTags(page, item), renderSeriesAirTime(page, item, isStatic), renderDynamicMediaIcons(page, item) ? page.querySelector(".mediaInfoIcons").classList.remove("hide") : page.querySelector(".mediaInfoIcons").classList.add("hide");
		var artist = page.querySelectorAll(".artist");
		for (i = 0, length = artist.length; i < length; i++) item.ArtistItems && item.ArtistItems.length && "MusicAlbum" != item.Type ? (artist[i].classList.remove("hide"), artist[i].innerHTML = getArtistLinksHtml(item.ArtistItems, context)) : artist[i].classList.add("hide");
		item.MediaSources && item.MediaSources.length && item.Path ? page.querySelector(".audioVideoMediaInfo").classList.remove("hide") : page.querySelector(".audioVideoMediaInfo").classList.add("hide"), "Photo" == item.MediaType ? (page.querySelector(".photoInfo").classList.remove("hide"), renderPhotoInfo(page, item)) : page.querySelector(".photoInfo").classList.add("hide")
	}

	function renderDynamicMediaIcons(view, item) {
		var html = mediaInfo.getMediaInfoStats(item).map(function (mediaInfoItem) {
			var text = mediaInfoItem.text;
			return "added" === mediaInfoItem.type ? '<div class="mediaInfoText">' + text + "</div>" : '<div class="mediaInfoText mediaInfoText-upper">' + text + "</div>"
		}).join("");
		return view.querySelector(".mediaInfoIcons").innerHTML = html, html
	}

	function renderPhotoInfo(page, item) {
		var html = "",
			attributes = [];
		if (item.CameraMake && attributes.push(createAttribute(globalize.translate("MediaInfoCameraMake"), item.CameraMake)), item.CameraModel && attributes.push(createAttribute(globalize.translate("MediaInfoCameraModel"), item.CameraModel)), item.Altitude && attributes.push(createAttribute(globalize.translate("MediaInfoAltitude"), item.Altitude.toFixed(1))), item.Aperture && attributes.push(createAttribute(globalize.translate("MediaInfoAperture"), "F" + item.Aperture.toFixed(1))), item.ExposureTime) {
			var val = 1 / item.ExposureTime;
			attributes.push(createAttribute(globalize.translate("MediaInfoExposureTime"), "1/" + val + " s"))
		}
		item.FocalLength && attributes.push(createAttribute(globalize.translate("MediaInfoFocalLength"), item.FocalLength.toFixed(1) + " mm")), item.ImageOrientation, item.IsoSpeedRating && attributes.push(createAttribute(globalize.translate("MediaInfoIsoSpeedRating"), item.IsoSpeedRating)), item.Latitude && attributes.push(createAttribute(globalize.translate("MediaInfoLatitude"), item.Latitude.toFixed(1))), item.Longitude && attributes.push(createAttribute(globalize.translate("MediaInfoLongitude"), item.Longitude.toFixed(1))), item.ShutterSpeed && attributes.push(createAttribute(globalize.translate("MediaInfoShutterSpeed"), item.ShutterSpeed)), item.Software && attributes.push(createAttribute(globalize.translate("MediaInfoSoftware"), item.Software)), html += attributes.join("<br/>"), page.querySelector(".photoInfoContent").innerHTML = html
	}

	function getArtistLinksHtml(artists, context) {
		for (var html = [], i = 0, length = artists.length; i < length; i++) {
			var artist = artists[i];
			html.push('<a class="textlink" href="itemdetails.html?id=' + artist.Id + '">' + artist.Name + "</a>")
		}
		return html = html.join(" / "), 1 == artists.length ? globalize.translate("ValueArtist", html) : artists.length > 1 ? globalize.translate("ValueArtists", html) : html
	}

	function enableScrollX() {
		return browserInfo.mobile && screen.availWidth <= 1e3
	}

	function getPortraitShape(scrollX) {
		return null == scrollX && (scrollX = enableScrollX()), scrollX ? "overflowPortrait" : "portrait"
	}

	function getSquareShape(scrollX) {
		return null == scrollX && (scrollX = enableScrollX()), scrollX ? "overflowSquare" : "square"
	}

	function getThumbShape(scrollX) {
		return null == scrollX && (scrollX = enableScrollX()), scrollX ? "overflowBackdrop" : "backdrop"
	}

	function renderMoreFromItems(page, item) {
		var moreFromSection = page.querySelector("#moreFromSection");
		if (moreFromSection) return "MusicAlbum" == item.Type && item.AlbumArtists && item.AlbumArtists.length ? void ApiClient.getItems(Dashboard.getCurrentUserId(), {
			IncludeItemTypes: "MusicAlbum",
			ArtistIds: item.AlbumArtists[0].Id,
			Recursive: !0,
			ExcludeItemIds: item.Id,
			SortBy: "ProductionYear,SortName"
		}).then(function (result) {
			if (!result.Items.length) return void moreFromSection.classList.add("hide");
			moreFromSection.classList.remove("hide"), moreFromSection.querySelector(".moreFromHeader").innerHTML = globalize.translate("MoreFromValue", item.AlbumArtists[0].Name);
			var html = "";
			html += enableScrollX() ? '<div is="emby-itemscontainer" class="hiddenScrollX itemsContainer padded-left padded-right">' : '<div is="emby-itemscontainer" class="itemsContainer vertical-wrap padded-left padded-right">';
			var shape = "MusicAlbum" == item.Type || "MusicArtist" == item.Type ? getSquareShape() : getPortraitShape(),
				supportsImageAnalysis = appHost.supports("imageanalysis");
			supportsImageAnalysis = !1, html += cardBuilder.getCardsHtml({
				items: result.Items,
				shape: shape,
				showParentTitle: "MusicAlbum" == item.Type,
				centerText: !supportsImageAnalysis,
				showTitle: "MusicAlbum" == item.Type || "Game" == item.Type || "MusicArtist" == item.Type,
				coverImage: "MusicAlbum" == item.Type || "MusicArtist" == item.Type,
				overlayPlayButton: !0,
				cardLayout: supportsImageAnalysis,
				vibrant: supportsImageAnalysis
			}), html += "</div>";
			var similarContent = page.querySelector("#moreFromItems");
			similarContent.innerHTML = html, imageLoader.lazyChildren(similarContent)
		}) : void moreFromSection.classList.add("hide")
	}

	function renderSimilarItems(page, item, context) {
		var similarCollapsible = page.querySelector("#similarCollapsible");
		if (similarCollapsible) {
			if ("Movie" != item.Type && "Trailer" != item.Type && "Series" != item.Type && "Program" != item.Type && "Recording" != item.Type && "Game" != item.Type && "MusicAlbum" != item.Type && "MusicArtist" != item.Type && "ChannelVideoItem" != item.Type) return void similarCollapsible.classList.add("hide");
			similarCollapsible.classList.remove("hide");
			var shape = "MusicAlbum" == item.Type || "MusicArtist" == item.Type ? getSquareShape() : getPortraitShape(),
				options = {
					userId: Dashboard.getCurrentUserId(),
					limit: "MusicAlbum" == item.Type || "MusicArtist" == item.Type ? 8 : 10,
					fields: "PrimaryImageAspectRatio,UserData,CanDelete"
				};
			"MusicAlbum" == item.Type && item.AlbumArtists && item.AlbumArtists.length && (options.ExcludeArtistIds = item.AlbumArtists[0].Id), enableScrollX() && (options.limit = 12), ApiClient.getSimilarItems(item.Id, options).then(function (result) {
				if (!result.Items.length) return void similarCollapsible.classList.add("hide");
				similarCollapsible.classList.remove("hide");
				var html = "";
				html += enableScrollX() ? '<div is="emby-itemscontainer" class="hiddenScrollX itemsContainer padded-left padded-right">' : '<div is="emby-itemscontainer" class="itemsContainer vertical-wrap padded-left padded-right">';
				var supportsImageAnalysis = appHost.supports("imageanalysis"),
					cardLayout = supportsImageAnalysis && ("MusicAlbum" == item.Type || "Game" == item.Type || "MusicArtist" == item.Type);
				cardLayout = !1, html += cardBuilder.getCardsHtml({
					items: result.Items,
					shape: shape,
					showParentTitle: "MusicAlbum" == item.Type,
					centerText: !cardLayout,
					showTitle: "MusicAlbum" == item.Type || "Game" == item.Type || "MusicArtist" == item.Type,
					context: context,
					lazy: !0,
					showDetailsMenu: !0,
					coverImage: "MusicAlbum" == item.Type || "MusicArtist" == item.Type,
					overlayPlayButton: !0,
					cardLayout: cardLayout,
					vibrant: cardLayout && supportsImageAnalysis
				}), html += "</div>";
				var similarContent = similarCollapsible.querySelector(".similarContent");
				similarContent.innerHTML = html, imageLoader.lazyChildren(similarContent)
			})
		}
	}

	function renderSeriesAirTime(page, item, isStatic) {
		var seriesAirTime = page.querySelector("#seriesAirTime");
		if ("Series" != item.Type) return void seriesAirTime.classList.add("hide");
		var html = "";
		if (item.AirDays && item.AirDays.length && (html += 7 == item.AirDays.length ? "daily" : item.AirDays.map(function (a) {
			return a + "s"
		}).join(",")), item.AirTime && (html += " at " + item.AirTime), item.Studios.length)
			if (isStatic) html += " on " + item.Studios[0].Name;
			else {
				var context = inferContext(item),
					href = embyRouter.getRouteUrl(item.Studios[0], {
						context: context,
						itemType: "Studio"
					});
				html += ' on <a class="textlink button-link" is="emby-linkbutton" href="' + href + '">' + item.Studios[0].Name + "</a>"
			}
		html ? (html = ("Ended" == item.Status ? "Aired " : "Airs ") + html, seriesAirTime.innerHTML = html, seriesAirTime.classList.remove("hide")) : seriesAirTime.classList.add("hide")
	}

	function renderTags(page, item) {
		var itemTags = page.querySelector(".itemTags");
		if (item.Tags && item.Tags.length) {
			for (var html = "", i = 0, length = item.Tags.length; i < length; i++) html += '<div class="itemTag">' + item.Tags[i] + "</div>";
			itemTags.innerHTML = html, itemTags.classList.remove("hide")
		} else itemTags.classList.add("hide")
	}

	function getEpisodesFunction(seriesId, query) {
		return query = Object.assign({}, query),
			function (index, limit, fields) {
				return query.StartIndex = index, query.Limit = limit, query.Fields = fields, ApiClient.getEpisodes(seriesId, query)
			}
	}

	function getAlbumSongsFunction(query) {
		return query = Object.assign({}, query),
			function (index, limit, fields) {
				return query.StartIndex = index, query.Limit = limit, query.Fields = fields, ApiClient.getItems(Dashboard.getCurrentUserId(), query)
			}
	}

	function renderChildren(page, item) {
		_childrenItemsFunction = null;
		var fields = "ItemCounts,PrimaryImageAspectRatio,BasicSyncInfo,CanDelete",
			query = {
				ParentId: item.Id,
				Fields: fields
			};
		"BoxSet" !== item.Type && (query.SortBy = "SortName");
		var promise, userId = Dashboard.getCurrentUserId();
		"Series" == item.Type ? promise = ApiClient.getSeasons(item.Id, {
			userId: userId,
			Fields: fields
		}) : "Season" == item.Type ? (promise = ApiClient.getEpisodes(item.SeriesId, {
			seasonId: item.Id,
			userId: userId,
			Fields: fields
		}), _childrenItemsFunction = getEpisodesFunction(item.SeriesId, {
			seasonId: item.Id,
			userId: userId,
			Fields: fields
		})) : "Episode" == item.Type && item.SeriesId && item.SeasonId ? (promise = ApiClient.getEpisodes(item.SeriesId, {
			seasonId: item.SeasonId,
			userId: userId,
			Fields: fields
		}), _childrenItemsFunction = getEpisodesFunction(item.SeriesId, {
			seasonId: item.SeasonId,
			userId: userId,
			Fields: fields
		})) : "MusicAlbum" == item.Type ? _childrenItemsFunction = getAlbumSongsFunction(query) : "MusicArtist" == item.Type && (query.SortBy = "ProductionYear,SortName"), promise = promise || ApiClient.getItems(Dashboard.getCurrentUserId(), query), promise.then(function (result) {
			var html = "",
				scrollX = !1,
				isList = !1,
				scrollClass = "hiddenScrollX",
				childrenItemsContainer = page.querySelector(".childrenItemsContainer");
			if ("MusicAlbum" == item.Type) html = listView.getListViewHtml({
				items: result.Items,
				smallIcon: !0,
				showIndex: !0,
				index: "disc",
				showIndexNumber: !0,
				playFromHere: !0,
				action: "playallfromhere",
				image: !1,
				artist: "auto",
				containerAlbumArtist: item.AlbumArtist,
				addToListButton: !0
			}), isList = !0;
			else if ("Series" == item.Type) scrollX = enableScrollX(), html = cardBuilder.getCardsHtml({
				items: result.Items,
				shape: getPortraitShape(),
				showTitle: !0,
				centerText: !0,
				lazy: !0,
				overlayPlayButton: !0,
				allowBottomPadding: !scrollX
			});
			else if ("Season" == item.Type || "Episode" == item.Type) {
				if ("Episode" === item.Type && childrenItemsContainer.classList.add("darkScroller"), scrollX = "Episode" == item.Type, browser.touch || (scrollClass = "smoothScrollX"), result.Items.length < 2 && "Episode" === item.Type) return;
				html = cardBuilder.getCardsHtml({
					items: result.Items,
					shape: getThumbShape(scrollX),
					showTitle: !0,
					displayAsSpecial: "Season" == item.Type && item.IndexNumber,
					playFromHere: !0,
					overlayText: !0,
					lazy: !0,
					showDetailsMenu: !0,
					overlayPlayButton: !0,
					allowBottomPadding: !scrollX,
					includeParentInfoInTitle: !1
				})
			} else "GameSystem" == item.Type && (html = cardBuilder.getCardsHtml({
				items: result.Items,
				shape: "auto",
				showTitle: !0,
				centerText: !0,
				lazy: !0,
				showDetailsMenu: !0
			}));
			if ("BoxSet" !== item.Type && page.querySelector("#childrenCollapsible").classList.remove("hide"), scrollX ? (childrenItemsContainer.classList.add(scrollClass), childrenItemsContainer.classList.remove("vertical-wrap"), childrenItemsContainer.classList.remove("vertical-list")) : (childrenItemsContainer.classList.remove("hiddenScrollX"), childrenItemsContainer.classList.remove("smoothScrollX"), isList ? (childrenItemsContainer.classList.add("vertical-list"), childrenItemsContainer.classList.remove("vertical-wrap")) : (childrenItemsContainer.classList.add("vertical-wrap"), childrenItemsContainer.classList.remove("vertical-list"))), childrenItemsContainer.innerHTML = html, imageLoader.lazyChildren(childrenItemsContainer), "BoxSet" == item.Type) {
				var collectionItemTypes = [{
					name: globalize.translate("HeaderVideos"),
					mediaType: "Video"
				}, {
					name: globalize.translate("HeaderSeries"),
					type: "Series"
				}, {
					name: globalize.translate("HeaderAlbums"),
					type: "MusicAlbum"
				}, {
					name: globalize.translate("HeaderGames"),
					type: "Game"
				}, {
					name: globalize.translate("HeaderBooks"),
					type: "Book"
				}];
				renderCollectionItems(page, item, collectionItemTypes, result.Items)
			} else if ("Episode" === item.Type) {
				var card = childrenItemsContainer.querySelector('.card[data-id="' + item.Id + '"]');
				card && scrollHelper.toStart(childrenItemsContainer, card.previousSibling || card, !0)
			}
		}), "Season" == item.Type ? page.querySelector("#childrenTitle").innerHTML = globalize.translate("HeaderEpisodes") : "Episode" == item.Type ? page.querySelector("#childrenTitle").innerHTML = globalize.translate("MoreFromValue", item.SeasonName) : "Series" == item.Type ? page.querySelector("#childrenTitle").innerHTML = globalize.translate("HeaderSeasons") : "MusicAlbum" == item.Type ? page.querySelector("#childrenTitle").innerHTML = globalize.translate("HeaderTracks") : "GameSystem" == item.Type ? page.querySelector("#childrenTitle").innerHTML = globalize.translate("HeaderGames") : page.querySelector("#childrenTitle").innerHTML = globalize.translate("HeaderItems"), "MusicAlbum" == item.Type ? page.querySelector(".childrenSectionHeader", page).classList.add("hide") : page.querySelector(".childrenSectionHeader", page).classList.remove("hide")
	}

	function renderItemsByName(page, item, user) {
		require("scripts/itembynamedetailpage".split(","), function () {
			window.ItemsByName.renderItems(page, item)
		})
	}

	function renderPlaylistItems(page, item, user) {
		require("scripts/playlistedit".split(","), function () {
			PlaylistViewer.render(page, item)
		})
	}

	function renderChannelGuide(page, item, user) {
		require("scripts/livetvchannel,scripts/livetvcomponents,livetvcss".split(","), function (liveTvChannelPage) {
			liveTvChannelPage.renderPrograms(page, item.Id)
		})
	}

	function renderSeriesSchedule(page, item, user) { }

	function inferContext(item) {
		return "Movie" == item.Type || "BoxSet" == item.Type ? "movies" : "Series" == item.Type || "Season" == item.Type || "Episode" == item.Type ? "tvshows" : "Game" == item.Type || "GameSystem" == item.Type ? "games" : "Game" == item.Type || "GameSystem" == item.Type ? "games" : "MusicArtist" == item.Type || "MusicAlbum" == item.Type ? "music" : null
	}

	function renderStudios(elem, item, isStatic) {
		var context = inferContext(item);
		if (item.Studios && item.Studios.length && "Series" != item.Type, 1) elem.classList.add("hide");
		else {
			for (var html = "", i = 0, length = item.Studios.length; i < length; i++)
				if (i > 0 && (html += "&nbsp;&nbsp;/&nbsp;&nbsp;"), isStatic) html += item.Studios[i].Name;
				else {
					item.Studios[i].Type = "Studio";
					var href = embyRouter.getRouteUrl(item.Studios[0], {
						context: context
					});
					html += '<a class="textlink button-link" is="emby-linkbutton" href="' + href + '">' + item.Studios[i].Name + "</a>"
				}
			var translationKey = item.Studios.length > 1 ? "ValueStudios" : "ValueStudio";
			html = globalize.translate(translationKey, html), elem.innerHTML = html, elem.classList.remove("hide")
		}
	}

	function renderGenres(elem, item, limit, isStatic) {
		var context = inferContext(item),
			html = "",
			genres = item.GenreItems;
		genres || (genres = (item.Genres || []).map(function (name) {
			return {
				Name: name
			}
		}) || []);
		for (var i = 0, length = genres.length; i < length && !(limit && i >= limit); i++)
			if (i > 0 && (html += '<span class="bulletSeparator">&bull;</span>'), isStatic) html += genres[i].Name;
			else {
				var type;
				switch (context) {
					case "tvshows":
						type = "Series";
						break;
					case "games":
						type = "Game";
						break;
					case "music":
						type = "MusicAlbum";
						break;
					default:
						type = "Movie"
				}
				var param, paramValue;
				genres[i].Id ? (param = "genreId", paramValue = genres[i].Id) : (param = "Audio" == item.Type || "MusicArtist" == item.Type || "MusicAlbum" == item.Type || "MusicVideo" == item.Type ? "musicgenre" : "genre", "Game" == item.MediaType && (param = "gamegenre"), paramValue = ApiClient.encodeName(genres[i].Name));
				var url = "secondaryitems.html?type=" + type + "&" + param + "=" + paramValue;
				html += '<a class="textlink button-link" is="emby-linkbutton" href="' + url + '">' + genres[i].Name + "</a>"
			}
		elem.innerHTML = html
	}

	function filterItemsByCollectionItemType(items, typeInfo) {
		return items.filter(function (item) {
			return typeInfo.mediaType ? item.MediaType == typeInfo.mediaType : item.Type == typeInfo.type
		})
	}

	function renderCollectionItems(page, parentItem, types, items) {
		page.querySelector(".collectionItems").innerHTML = "";
		var i, length;
		for (i = 0, length = types.length; i < length; i++) {
			var type = types[i],
				typeItems = filterItemsByCollectionItemType(items, type);
			typeItems.length && renderCollectionItemType(page, parentItem, type, typeItems)
		}
		var otherType = {
			name: globalize.translate("HeaderOtherItems")
		},
			otherTypeItems = items.filter(function (curr) {
				return !types.filter(function (t) {
					return filterItemsByCollectionItemType([curr], t).length > 0;
				}).length
			});
		otherTypeItems.length && renderCollectionItemType(page, parentItem, otherType, otherTypeItems), items.length || renderCollectionItemType(page, parentItem, {
			name: globalize.translate("HeaderItems")
		}, items)
	}

	function renderCollectionItemType(page, parentItem, type, items) {
		var html = "";
		html += '<div class="verticalSection">', html += '<div class="sectionTitleContainer padded-left">', html += '<h2 class="sectionTitle sectionTitle-cards">', html += "<span>" + type.name + "</span>", html += "</h2>", html += '<button class="btnAddToCollection sectionTitleButton" type="button" is="paper-icon-button-light" style="margin-left:1em;"><i class="md-icon" icon="add">add</i></button>', html += "</div>", html += '<div is="emby-itemscontainer" class="itemsContainer vertical-wrap padded-left padded-right">';
		var shape = "MusicAlbum" == type.type ? getSquareShape(!1) : getPortraitShape(!1);
		html += cardBuilder.getCardsHtml({
			items: items,
			shape: shape,
			showTitle: !0,
			centerText: !0,
			lazy: !0,
			showDetailsMenu: !0,
			overlayMoreButton: !0,
			showAddToCollection: !1,
			showRemoveFromCollection: !0,
			collectionId: parentItem.Id
		}), html += "</div>", html += "</div>";
		var collectionItems = page.querySelector(".collectionItems");
		collectionItems.insertAdjacentHTML("beforeend", html), imageLoader.lazyChildren(collectionItems), collectionItems.querySelector(".btnAddToCollection").addEventListener("click", function () {
			require(["alert"], function (alert) {
				alert({
					text: globalize.translate("AddItemToCollectionHelp"),
					html: globalize.translate("AddItemToCollectionHelp") + '<br/><br/><a is="emby-linkbutton" class="button-link" target="_blank" href="https://github.com/MediaBrowser/Wiki/wiki/Collections">' + globalize.translate("ButtonLearnMore") + "</a>"
				})
			})
		})
	}

	function renderCriticReviews(page, item, limit) {
		if ("Movie" != item.Type && "Trailer" != item.Type && "MusicVideo" != item.Type) return void page.querySelector("#criticReviewsCollapsible").classList.add("hide");
		var options = {};
		limit && (options.limit = limit), ApiClient.getCriticReviews(item.Id, options).then(function (result) {
			result.TotalRecordCount ? (page.querySelector("#criticReviewsCollapsible").classList.remove("hide"), renderCriticReviewsContent(page, result, limit)) : page.querySelector("#criticReviewsCollapsible").classList.add("hide")
		})
	}

	function renderCriticReviewsContent(page, result, limit) {
		for (var html = "", reviews = result.Items, i = 0, length = reviews.length; i < length; i++) {
			var review = reviews[i];
			html += '<div class="paperList criticReviewPaperList">', html += '<div class="listItem">', null != review.Score || null != review.Likes && (html += review.Likes ? "<div style=\"flex-shrink:0;background-color:transparent;background-image:url('css/images/fresh.png');background-repeat:no-repeat;background-position:center center;background-size: cover;width:40px;height:40px;\"></div>" : "<div style=\"flex-shrink:0;background-color:transparent;background-image:url('css/images/rotten.png');background-repeat:no-repeat;background-position:center center;background-size: cover;width:40px;height:40px;\"></div>"), html += '<div class="listItemBody two-line">', html += '<h3 class="listItemBodyText" style="white-space:normal;">' + review.Caption + "</h3>";
			var vals = [];
			if (review.ReviewerName && vals.push(review.ReviewerName), review.Publisher && vals.push(review.Publisher), html += '<div class="secondary listItemBodyText">' + vals.join(", ") + ".", review.Date) try {
				var date = datetime.toLocaleDateString(datetime.parseISO8601Date(review.Date, !0));
				html += '<span class="reviewDate">' + date + "</span>"
			} catch (error) { }
			html += "</div>", review.Url && (html += '<div class="secondary listItemBodyText"><a is="emby-linkbutton" class="button-link textlink" href="' + review.Url + '" target="_blank" data-autohide="true">' + globalize.translate("ButtonFullReview") + "</a></div>"), html += "</div>", html += "</div>", html += "</div>"
		}
		limit && result.TotalRecordCount > limit && (html += '<p style="margin: 0;"><button is="emby-button" type="button" class="raised more moreCriticReviews">' + globalize.translate("ButtonMore") + "</button></p>");
		var criticReviewsContent = page.querySelector("#criticReviewsContent");
		criticReviewsContent.innerHTML = html, enableScrollX() ? criticReviewsContent.classList.add("hiddenScrollX") : criticReviewsContent.classList.remove("hiddenScrollX")
	}

	function renderThemeMedia(page, item) {
		"SeriesTimer" !== item.Type && "Timer" !== item.Type && "Genre" !== item.Type && "MusicGenre" !== item.Type && "GameGenre" !== item.Type && "Studio" !== item.Type && "Person" !== item.Type && ApiClient.getThemeMedia(Dashboard.getCurrentUserId(), item.Id, !0).then(function (result) {
			var themeSongs = result.ThemeSongsResult.OwnerId == item.Id ? result.ThemeSongsResult.Items : [],
				themeVideos = result.ThemeVideosResult.OwnerId == item.Id ? result.ThemeVideosResult.Items : [];
			renderThemeSongs(page, themeSongs), renderThemeVideos(page, themeVideos)
		})
	}

	function renderThemeSongs(page, items) {
		if (items.length) {
			page.querySelector("#themeSongsCollapsible").classList.remove("hide");
			var html = listView.getListViewHtml({
				items: items
			});
			page.querySelector("#themeSongsContent").innerHTML = html
		} else page.querySelector("#themeSongsCollapsible").classList.add("hide")
	}

	function renderThemeVideos(page, items, user) {
		if (items.length) {
			page.querySelector("#themeVideosCollapsible").classList.remove("hide");
			var themeVideosContent = page.querySelector("#themeVideosContent");
			themeVideosContent.innerHTML = getVideosHtml(items, user), imageLoader.lazyChildren(themeVideosContent)
		} else page.querySelector("#themeVideosCollapsible").classList.add("hide")
	}

	function renderMusicVideos(page, item, user) {
		ApiClient.getItems(user.Id, {
			SortBy: "SortName",
			SortOrder: "Ascending",
			IncludeItemTypes: "MusicVideo",
			Recursive: !0,
			Fields: "DateCreated,CanDelete",
			AlbumIds: item.Id
		}).then(function (result) {
			if (result.Items.length) {
				page.querySelector("#musicVideosCollapsible").classList.remove("hide");
				var musicVideosContent = page.querySelector(".musicVideosContent");
				musicVideosContent.innerHTML = getVideosHtml(result.Items, user), imageLoader.lazyChildren(musicVideosContent)
			} else page.querySelector("#musicVideosCollapsible").classList.add("hide")
		})
	}

	function renderAdditionalParts(page, item, user) {
		ApiClient.getAdditionalVideoParts(user.Id, item.Id).then(function (result) {
			if (result.Items.length) {
				page.querySelector("#additionalPartsCollapsible").classList.remove("hide");
				var additionalPartsContent = page.querySelector("#additionalPartsContent");
				additionalPartsContent.innerHTML = getVideosHtml(result.Items, user), imageLoader.lazyChildren(additionalPartsContent)
			} else page.querySelector("#additionalPartsCollapsible").classList.add("hide")
		})
	}

	function renderScenes(page, item) {
		var chapters = item.Chapters || [];
		if (chapters.length && !chapters[0].ImageTag && (chapters = []), chapters.length) {
			page.querySelector("#scenesCollapsible").classList.remove("hide");
			var scenesContent = page.querySelector("#scenesContent");
			enableScrollX() ? scenesContent.classList.add("smoothScrollX") : scenesContent.classList.add("vertical-wrap"), require(["chaptercardbuilder"], function (chaptercardbuilder) {
				chaptercardbuilder.buildChapterCards(item, chapters, {
					itemsContainer: scenesContent,
					width: 400,
					backdropShape: getThumbShape(),
					squareShape: getSquareShape()
				})
			})
		} else page.querySelector("#scenesCollapsible").classList.add("hide")
	}

	function renderMediaSources(page, user, item) {
		var html = item.MediaSources.map(function (v) {
			return getMediaSourceHtml(user, item, v)
		}).join('<div style="border-top:1px solid #444;margin: 1em 0;"></div>');
		item.MediaSources.length > 1 && (html = "<br/>" + html);
		var mediaInfoContent = page.querySelector("#mediaInfoContent");
		mediaInfoContent.innerHTML = html
	}

	function getMediaSourceHtml(user, item, version) {
		var html = "";
		version.Name && item.MediaSources.length > 1 && (html += '<div><span class="mediaInfoAttribute">' + version.Name + "</span></div><br/>");
		for (var i = 0, length = version.MediaStreams.length; i < length; i++) {
			var stream = version.MediaStreams[i];
			if ("Data" != stream.Type) {
				html += '<div class="mediaInfoStream">';
				var displayType = globalize.translate("MediaInfoStreamType" + stream.Type);
				html += '<h3 class="mediaInfoStreamType">' + displayType + "</h3>";
				var attributes = [];
				stream.Language && "Video" != stream.Type && attributes.push(createAttribute(globalize.translate("MediaInfoLanguage"), stream.Language)), stream.Codec && attributes.push(createAttribute(globalize.translate("MediaInfoCodec"), stream.Codec.toUpperCase())), stream.CodecTag && attributes.push(createAttribute(globalize.translate("MediaInfoCodecTag"), stream.CodecTag)), null != stream.IsAVC && attributes.push(createAttribute("AVC", stream.IsAVC ? "Yes" : "No")), stream.Profile && attributes.push(createAttribute(globalize.translate("MediaInfoProfile"), stream.Profile)), stream.Level && attributes.push(createAttribute(globalize.translate("MediaInfoLevel"), stream.Level)), (stream.Width || stream.Height) && attributes.push(createAttribute(globalize.translate("MediaInfoResolution"), stream.Width + "x" + stream.Height)), stream.AspectRatio && "mjpeg" != stream.Codec && attributes.push(createAttribute(globalize.translate("MediaInfoAspectRatio"), stream.AspectRatio)), "Video" == stream.Type && (null != stream.IsAnamorphic && attributes.push(createAttribute(globalize.translate("MediaInfoAnamorphic"), stream.IsAnamorphic ? "Yes" : "No")), attributes.push(createAttribute(globalize.translate("MediaInfoInterlaced"), stream.IsInterlaced ? "Yes" : "No"))), (stream.AverageFrameRate || stream.RealFrameRate) && attributes.push(createAttribute(globalize.translate("MediaInfoFramerate"), stream.AverageFrameRate || stream.RealFrameRate)), stream.ChannelLayout && attributes.push(createAttribute(globalize.translate("MediaInfoLayout"), stream.ChannelLayout)), stream.Channels && attributes.push(createAttribute(globalize.translate("MediaInfoChannels"), stream.Channels + " ch")), stream.BitRate && "mjpeg" != stream.Codec && attributes.push(createAttribute(globalize.translate("MediaInfoBitrate"), parseInt(stream.BitRate / 1e3) + " kbps")), stream.SampleRate && attributes.push(createAttribute(globalize.translate("MediaInfoSampleRate"), stream.SampleRate + " Hz")), stream.BitDepth && attributes.push(createAttribute(globalize.translate("MediaInfoBitDepth"), stream.BitDepth + " bit")), stream.PixelFormat && attributes.push(createAttribute(globalize.translate("MediaInfoPixelFormat"), stream.PixelFormat)), stream.RefFrames && attributes.push(createAttribute(globalize.translate("MediaInfoRefFrames"), stream.RefFrames)), stream.NalLengthSize && attributes.push(createAttribute("NAL", stream.NalLengthSize)), "Video" != stream.Type && attributes.push(createAttribute(globalize.translate("MediaInfoDefault"), stream.IsDefault ? "Yes" : "No")), "Subtitle" == stream.Type && (attributes.push(createAttribute(globalize.translate("MediaInfoForced"), stream.IsForced ? "Yes" : "No")), attributes.push(createAttribute(globalize.translate("MediaInfoExternal"), stream.IsExternal ? "Yes" : "No"))), "Video" == stream.Type && version.Timestamp && attributes.push(createAttribute(globalize.translate("MediaInfoTimestamp"), version.Timestamp)), stream.DisplayTitle && attributes.push(createAttribute("Title", stream.DisplayTitle)), html += attributes.join("<br/>"), html += "</div>"
			}
		}
		if (version.Container && (html += '<div><span class="mediaInfoLabel">' + globalize.translate("MediaInfoContainer") + '</span><span class="mediaInfoAttribute">' + version.Container + "</span></div>"), version.Formats && version.Formats.length, version.Path && "Http" != version.Protocol && user && user.Policy.IsAdministrator && (html += '<div style="max-width:600px;overflow:hidden;"><span class="mediaInfoLabel">' + globalize.translate("MediaInfoPath") + '</span><span class="mediaInfoAttribute">' + version.Path + "</span></div>"), version.Size) {
			var size = (version.Size / 1048576).toFixed(0);
			html += '<div><span class="mediaInfoLabel">' + globalize.translate("MediaInfoSize") + '</span><span class="mediaInfoAttribute">' + size + " MB</span></div>"
		}
		return html
	}

	function createAttribute(label, value) {
		return '<span class="mediaInfoLabel">' + label + '</span><span class="mediaInfoAttribute">' + value + "</span>"
	}

	function getVideosHtml(items, user, limit, moreButtonClass) {
		var html = cardBuilder.getCardsHtml({
			items: items,
			shape: "auto",
			showTitle: !0,
			action: "play",
			overlayText: !0,
			showRuntime: !0
		});
		return limit && items.length > limit && (html += '<p style="margin: 0;padding-left:5px;"><button is="emby-button" type="button" class="raised more ' + moreButtonClass + '">' + globalize.translate("ButtonMore") + "</button></p>"), html
	}

	function renderSpecials(page, item, user, limit) {
		ApiClient.getSpecialFeatures(user.Id, item.Id).then(function (specials) {
			var specialsContent = page.querySelector("#specialsContent");
			specialsContent.innerHTML = getVideosHtml(specials, user, limit, "moreSpecials"), imageLoader.lazyChildren(specialsContent)
		})
	}

	function renderCast(page, item, context, limit, isStatic) {
		var people = item.People || [],
			castContent = page.querySelector("#castContent");
		enableScrollX() ? (castContent.classList.add("smoothScrollX"), limit = 32) : castContent.classList.add("vertical-wrap");
		var limitExceeded = limit && people.length > limit;
		limitExceeded && (people = people.slice(0), people.length = Math.min(limit, people.length)), require(["peoplecardbuilder"], function (peoplecardbuilder) {
			peoplecardbuilder.buildPeopleCards(people, {
				itemsContainer: castContent,
				coverImage: !0,
				serverId: item.ServerId,
				width: 160,
				shape: getPortraitShape()
			})
		});
		var morePeopleButton = page.querySelector(".morePeople");
		morePeopleButton && (limitExceeded && !enableScrollX() ? morePeopleButton.classList.remove("hide") : morePeopleButton.classList.add("hide"))
	}

	function play(startPosition) {
		playbackManager.play({
			items: [currentItem],
			startPositionTicks: startPosition
		})
	}

	function playTrailer(page) {
		playbackManager.playTrailers(currentItem)
	}

	function showPlayMenu(item, target) {
		require(["playMenu"], function (playMenu) {
			playMenu.show({
				item: item,
				positionTo: target
			})
		})
	}

	function playCurrentItem(button, mode) {
		var item = currentItem;
		return "Program" === item.Type ? void ApiClient.getLiveTvChannel(item.ChannelId, Dashboard.getCurrentUserId()).then(function (channel) {
			playbackManager.play({
				items: [channel]
			})
		}) : void ("playmenu" === mode ? showPlayMenu(item, button) : playbackManager.play({
			items: [item],
			startPositionTicks: item.UserData && "resume" === mode ? item.UserData.PlaybackPositionTicks : 0
		}))
	}

	function reload(instance, page, params) {
		beginReload(instance, page, params), finishReload(instance, page, params)
	}

	function beginReload(instance, page, params) {
		loading.show(), instance.promises = [getPromise(params), Dashboard.getCurrentUser()]
	}

	function finishReload(instance, page, params) {
		var promises = instance.promises;
		promises && (instance.promises = null, Promise.all(promises).then(function (responses) {
			var item = responses[0],
				user = responses[1];
			reloadFromItem(instance, page, params, item, user)
		}))
	}

	function splitVersions(instance, page, params) {
		require(["confirm"], function (confirm) {
			confirm("Are you sure you wish to split the media sources into separate items?", "Split Media Apart").then(function () {
				loading.show(), ApiClient.ajax({
					type: "DELETE",
					url: ApiClient.getUrl("Videos/" + params.id + "/AlternateSources")
				}).then(function () {
					loading.hide(), reload(instance, page, params)
				})
			})
		})
	}

	function itemDetailPage() {
		var self = this;
		self.play = play, self.setInitialCollapsibleState = setInitialCollapsibleState, self.renderDetails = renderDetails, self.renderCriticReviews = renderCriticReviews, self.renderCast = renderCast, self.renderScenes = renderScenes, self.renderMediaSources = renderMediaSources
	}

	function onPlayClick() {
		var mode = this.getAttribute("data-mode");
		playCurrentItem(this, mode)
	}

	function onInstantMixClick() {
		playbackManager.instantMix(currentItem)
	}

	function onShuffleClick() {
		playbackManager.shuffle(currentItem)
	}

	function onDeleteClick() {
		require(["deleteHelper"], function (deleteHelper) {
			deleteHelper.deleteItem({
				item: currentItem,
				navigate: !0
			})
		})
	}

	function onCancelSeriesTimerClick() {
		require(["recordingHelper"], function (recordingHelper) {
			recordingHelper.cancelSeriesTimerWithConfirmation(currentItem.Id, currentItem.ServerId).then(function () {
				Dashboard.navigate("livetv.html")
			})
		})
	}

	function bindAll(view, selector, eventName, fn) {
		var i, length, elems = view.querySelectorAll(selector);
		for (i = 0, length = elems.length; i < length; i++) elems[i].addEventListener(eventName, fn)
	}
	var currentItem, _childrenItemsFunction = null;
	return window.ItemDetailPage = new itemDetailPage,
		function (view, params) {
			function onPlayTrailerClick() {
				//myproduction-change-start
				//Added piwik tracking
				var piwikTracker = Piwik.getAsyncTracker();
				piwikTracker.trackEvent("MediaAccess", "PlayedTrailer", currentItem.Name);
				//myproduction-change-end
				playTrailer(view)
			}

			function onDownloadChange() {
				reload(self, view, params)
			}

			function onMoreCommandsClick() {
				var button = this;
				connectionManager.getApiClient(currentItem.ServerId).getCurrentUser().then(function (user) {
					itemContextMenu.show(getContextMenuOptions(currentItem, user, button)).then(function (result) {
						result.deleted ? embyRouter.goHome() : result.updated && reload(self, view, params)
					})
				})
			}

			function editImages() {
				return new Promise(function (resolve, reject) {
					require(["imageEditor"], function (imageEditor) {
						imageEditor.show({
							itemId: currentItem.Id,
							serverId: currentItem.ServerId
						}).then(resolve, reject)
					})
				})
			}

			function onWebSocketMessage(e, data) {
				var msg = data;
				if ("UserDataChanged" === msg.MessageType && currentItem && msg.Data.UserId == Dashboard.getCurrentUserId()) {
					var key = currentItem.UserData.Key,
						userData = msg.Data.UserDataList.filter(function (u) {
							return u.Key == key
						})[0];
					userData && (currentItem.UserData = userData, reloadPlayButtons(view, currentItem), Dashboard.getCurrentUser().then(function (user) {
						refreshImage(view, currentItem, user)
					}))
				}
			}
			var self = this;
			view.querySelectorAll(".btnPlay");
			bindAll(view, ".btnPlay", "click", onPlayClick), bindAll(view, ".btnResume", "click", onPlayClick), bindAll(view, ".btnInstantMix", "click", onInstantMixClick), bindAll(view, ".btnShuffle", "click", onShuffleClick), bindAll(view, ".btnPlayTrailer", "click", onPlayTrailerClick), bindAll(view, ".btnCancelSeriesTimer", "click", onCancelSeriesTimerClick), bindAll(view, ".btnDeleteItem", "click", onDeleteClick), bindAll(view, ".btnSyncDownload", "download", onDownloadChange), bindAll(view, ".btnSyncDownload", "download-cancel", onDownloadChange), view.querySelector(".btnSplitVersions").addEventListener("click", function () {
				splitVersions(self, view, params)
			}), bindAll(view, ".btnMoreCommands", "click", onMoreCommandsClick), view.addEventListener("click", function (e) {
				dom.parentWithClass(e.target, "moreScenes") ? Dashboard.getCurrentUser().then(function (user) {
					renderScenes(view, currentItem, user)
				}) : dom.parentWithClass(e.target, "morePeople") ? renderCast(view, currentItem, params.context) : dom.parentWithClass(e.target, "moreSpecials") ? Dashboard.getCurrentUser().then(function (user) {
					renderSpecials(view, currentItem, user)
				}) : dom.parentWithClass(e.target, "moreCriticReviews") && renderCriticReviews(view, currentItem)
			}), view.querySelector(".collectionItems").addEventListener("needsrefresh", function (e) {
				renderChildren(view, currentItem)
			}), view.querySelector(".detailImageContainer").addEventListener("click", function (e) {
				var itemDetailGalleryLink = dom.parentWithClass(e.target, "itemDetailGalleryLink");
				itemDetailGalleryLink && editImages().then(function () {
					reload(self, view, params)
				})
			}), view.addEventListener("viewbeforeshow", function () {
				var page = this;
				beginReload(self, page, params), events.on(ApiClient, "websocketmessage", onWebSocketMessage)
			}), view.addEventListener("viewshow", function () {
				var page = this;
				finishReload(self, page, params), events.on(ApiClient, "websocketmessage", onWebSocketMessage)
			}), view.addEventListener("viewbeforehide", function () {
				currentItem = null, self.currentRecordingFields = null, events.off(ApiClient, "websocketmessage", onWebSocketMessage), libraryMenu.setTransparentMenu(!1)
			})
		}
});