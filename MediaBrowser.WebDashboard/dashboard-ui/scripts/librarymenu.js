define(["layoutManager", "connectionManager", "events", "viewManager", "libraryBrowser", "embyRouter", "apphost", "playbackManager", "browser", "globalize", "paper-icon-button-light", "material-icons", "scrollStyles", "flexStyles"], function (layoutManager, connectionManager, events, viewManager, libraryBrowser, embyRouter, appHost, playbackManager, browser, globalize) {
	"use strict";

	function renderHeader() {
		var html = "";
		html += '<div class="flex align-items-center flex-grow headerTop">', html += '<div class="headerLeft">';
		var backIcon = browser.safari ? "chevron_left" : "&#xE5C4;";
		//myproduction-change-start
		//Replaced user menu with logout button
		html += '<button type="button" is="paper-icon-button-light" class="headerButton headerButtonLeft headerBackButton hide"><i class="md-icon">' + backIcon + "</i></button>", html += '<button type="button" is="paper-icon-button-light" class="headerButton headerAppsButton hide barsMenuButton headerButtonLeft"><i class="md-icon">home</i></button>', html += '<button type="button" is="paper-icon-button-light" class="headerButton mainDrawerButton barsMenuButton headerButtonLeft hide"><i class="md-icon">menu</i></button>', html += '<h3 class="libraryMenuButtonText headerButton"></h3>', html += "</div>", html += '<div class="headerRight">', html += '<span class="headerSelectedPlayer"></span>', html += '<button is="paper-icon-button-light" class="btnCast headerButton-btnCast headerButton headerButtonRight hide autoSize"><i class="md-icon">&#xE307;</i></button>', html += '<button type="button" is="paper-icon-button-light" class="headerButton headerButtonRight headerSearchButton hide autoSize"><i class="md-icon">search</i></button>', html += '<button is="paper-icon-button-light" class="headerButton headerButtonRight btnNotifications"><div class="btnNotificationsInner">0</div></button>', html += '<button style="display: block;font-weight:normal;" is="paper-icon-button-light" class="headerButton headerButtonRight btnLogout autoSize" onclick="Dashboard.logout();"><i class="md-icon">lock</i> Abmelden</button>', layoutManager.mobile || (html += '<button is="paper-icon-button-light" class="headerButton headerButtonRight dashboardEntryHeaderButton autoSize" onclick="return LibraryMenu.onSettingsClicked(event);"><i class="md-icon">settings</i></button>'), html += "</div>", html += "</div>", html += '<div class="headerTabs sectionTabs hide">', html += "</div>", skinHeader.innerHTML = html, btnHome = skinHeader.querySelector(".headerAppsButton"), browser.chrome || skinHeader.classList.add("skinHeader-blurred"), lazyLoadViewMenuBarImages(), bindMenuEvents()
		//myproduction-change-end
	}

	function lazyLoadViewMenuBarImages() {
		require(["imageLoader"], function (imageLoader) {
			imageLoader.lazyChildren(skinHeader)
		})
	}

	function onBackClick() {
		embyRouter.back()
	}

	function updateUserInHeader(user) {
		var hasImage, headerUserButton = skinHeader.querySelector(".headerUserButton");
		if (user && user.name && user.imageUrl) {
			var userButtonHeight = 26,
				url = user.imageUrl;
			user.supportsImageParams && (url += "&height=" + Math.round(userButtonHeight * Math.max(window.devicePixelRatio || 1, 2))), headerUserButton && (updateHeaderUserButton(headerUserButton, url), hasImage = !0)
		}
		headerUserButton && !hasImage && updateHeaderUserButton(headerUserButton, null), user && updateLocalUser(user.localUser), requiresUserRefresh = !1
	}

	function updateHeaderUserButton(headerUserButton, src) {
		src ? (headerUserButton.classList.add("headerUserButtonRound"), headerUserButton.classList.remove("autoSize"), headerUserButton.innerHTML = '<img src="' + src + '" />') : (headerUserButton.classList.remove("headerUserButtonRound"), headerUserButton.classList.add("autoSize"), headerUserButton.innerHTML = '<i class="md-icon">person</i>')
	}

	function updateLocalUser(user) {
		var headerSearchButton = skinHeader.querySelector(".headerSearchButton"),
			btnCast = skinHeader.querySelector(".btnCast"),
			dashboardEntryHeaderButton = skinHeader.querySelector(".dashboardEntryHeaderButton");
		user ? (btnCast.classList.remove("hide"), headerSearchButton && headerSearchButton.classList.remove("hide"), dashboardEntryHeaderButton && (user.Policy.IsAdministrator ? dashboardEntryHeaderButton.classList.remove("hide") : dashboardEntryHeaderButton.classList.add("hide"))) : (btnCast.classList.add("hide"), headerSearchButton && headerSearchButton.classList.add("hide"), dashboardEntryHeaderButton && dashboardEntryHeaderButton.classList.add("hide"))
	}

	function showSearch() {
		Dashboard.navigate("search.html")
	}

	function onHeaderUserButtonClick(e) {
		Dashboard.showUserFlyout(e.target)
	}

	function onHeaderAppsButtonClick() {
		Dashboard.navigate("home.html")
	}

	function bindMenuEvents() {
		mainDrawerButton = document.querySelector(".mainDrawerButton"), mainDrawerButton && mainDrawerButton.addEventListener("click", toggleMainDrawer);
		var headerBackButton = document.querySelector(".headerBackButton");
		headerBackButton && headerBackButton.addEventListener("click", onBackClick);
		var headerSearchButton = document.querySelector(".headerSearchButton");
		headerSearchButton && headerSearchButton.addEventListener("click", showSearch);
		var headerUserButton = document.querySelector(".headerUserButton");
		headerUserButton && headerUserButton.addEventListener("click", onHeaderUserButtonClick);
		var headerAppsButton = document.querySelector(".headerAppsButton");
		headerAppsButton && headerAppsButton.addEventListener("click", onHeaderAppsButtonClick), initHeadRoom(skinHeader), skinHeader.querySelector(".btnNotifications").addEventListener("click", function () {
			Dashboard.navigate("notificationlist.html")
		});
		var btnCast = document.querySelector(".headerButton-btnCast");
		btnCast && btnCast.addEventListener("click", onCastButtonClicked)
	}

	function onCastButtonClicked() {
		var btn = this;
		require(["playerSelectionMenu"], function (playerSelectionMenu) {
			playerSelectionMenu.show(btn)
		})
	}

	function getItemHref(item, context) {
		return embyRouter.getRouteUrl(item, {
			context: context
		})
	}

	function toggleMainDrawer() {
		navDrawerInstance.isVisible ? closeMainDrawer() : openMainDrawer()
	}

	function openMainDrawer() {
		navDrawerInstance.open(), lastOpenTime = (new Date).getTime()
	}

	function onMainDrawerOpened() {
		layoutManager.mobile && document.body.classList.add("bodyWithPopupOpen")
	}

	function closeMainDrawer() {
		navDrawerInstance.close()
	}

	function onMainDrawerSelect(e) {
		navDrawerInstance.isVisible ? onMainDrawerOpened() : document.body.classList.remove("bodyWithPopupOpen")
	}

	function refreshLibraryInfoInDrawer(user, drawer) {
		var html = "";
		html += '<div style="height:.5em;"></div>';
		var homeHref = window.ApiClient ? "home.html" : "selectserver.html?showuser=1";
		html += '<a class="sidebarLink lnkMediaFolder" href="' + homeHref + '" onclick="return LibraryMenu.onLinkClicked(event, this);"><i class="md-icon sidebarLinkIcon">home</i><span class="sidebarLinkText">' + globalize.translate("ButtonHome") + "</span></a>", html += '<div class="libraryMenuDownloads">', html += '<div class="sidebarDivider"></div>', html += '<div class="sidebarHeader">', html += globalize.translate("sharedcomponents#HeaderMyDownloads"), html += "</div>", html += '<a class="sidebarLink lnkMediaFolder" data-itemid="manageoffline" onclick="return LibraryMenu.onLinkClicked(event, this);" href="offline/offline.html"><i class="md-icon sidebarLinkIcon">folder</i><span class="sidebarLinkText">' + globalize.translate("sharedcomponents#Browse") + "</span></a>", html += '<a class="sidebarLink lnkMediaFolder" data-itemid="manageoffline" onclick="return LibraryMenu.onLinkClicked(event, this);" href="managedownloads.html"><i class="md-icon sidebarLinkIcon">edit</i><span class="sidebarLinkText">' + globalize.translate("sharedcomponents#Manage") + "</span></a>", html += "</div>", html += '<div class="sidebarDivider"></div>', html += '<div class="libraryMenuOptions">', html += "</div>";
		var localUser = user.localUser;
		localUser && localUser.Policy.IsAdministrator && (html += '<div class="adminMenuOptions">', html += '<div class="sidebarDivider"></div>', html += '<div class="sidebarHeader">', html += globalize.translate("HeaderAdmin"), html += "</div>", html += '<a class="sidebarLink lnkMediaFolder lnkManageServer" data-itemid="dashboard" onclick="return LibraryMenu.onLinkClicked(event, this);" href="dashboard.html"><span class="sidebarLinkText">' + globalize.translate("ButtonManageServer") + "</span></a>", html += '<a class="sidebarLink lnkMediaFolder editorViewMenu" data-itemid="editor" onclick="return LibraryMenu.onLinkClicked(event, this);" href="edititemmetadata.html"><span class="sidebarLinkText">' + globalize.translate("MetadataManager") + "</span></a>", layoutManager.mobile || (html += '<a class="sidebarLink lnkMediaFolder" data-itemid="reports" onclick="return LibraryMenu.onLinkClicked(event, this);" href="reports.html"><span class="sidebarLinkText">' + globalize.translate("ButtonReports") + "</span></a>"), html += "</div>"), html += '<div class="userMenuOptions">', html += '<div class="sidebarDivider"></div>', user.localUser && (html += '<a class="sidebarLink lnkMediaFolder lnkMySettings" onclick="return LibraryMenu.onLinkClicked(event, this);" href="mypreferencesmenu.html"><span class="sidebarLinkText">' + globalize.translate("ButtonSettings") + "</span></a>"), html += '<a class="sidebarLink lnkMediaFolder lnkSyncToOtherDevices" data-itemid="syncotherdevices" onclick="return LibraryMenu.onLinkClicked(event, this);" href="mysync.html"><span class="sidebarLinkText">' + globalize.translate("SyncToOtherDevices") + "</span></a>", Dashboard.isConnectMode() && (html += '<a class="sidebarLink lnkMediaFolder" data-itemid="selectserver" onclick="return LibraryMenu.onLinkClicked(event, this);" href="selectserver.html?showuser=1"><span class="sidebarLinkText">' + globalize.translate("ButtonSelectServer") + "</span></a>"), user.localUser && (html += '<a class="sidebarLink lnkMediaFolder" data-itemid="logout" onclick="return LibraryMenu.onLogoutClicked(this);" href="#"><span class="sidebarLinkText">' + globalize.translate("ButtonSignOut") + "</span></a>"), html += "</div>", navDrawerScrollContainer.innerHTML = html;
		var lnkManageServer = navDrawerScrollContainer.querySelector(".lnkManageServer");
		lnkManageServer && lnkManageServer.addEventListener("click", onManageServerClicked)
	}

	function refreshDashboardInfoInDrawer(page, user) {
		currentDrawerType = "admin", loadNavDrawer(), navDrawerScrollContainer.querySelector(".adminDrawerLogo") ? updateDashboardMenuSelectedItem() : createDashboardMenu(page)
	}

	function updateDashboardMenuSelectedItem() {
		for (var links = navDrawerScrollContainer.querySelectorAll(".sidebarLink"), i = 0, length = links.length; i < length; i++) {
			var link = links[i],
				selected = !1,
				pageIds = link.getAttribute("data-pageids");
			if (pageIds && (selected = pageIds.split(",").indexOf(viewManager.currentView().id) != -1), selected) {
				link.classList.add("selectedSidebarLink");
				var title = "";
				link = link.querySelector("span") || link;
				var secondaryTitle = (link.innerText || link.textContent).trim();
				title += secondaryTitle, LibraryMenu.setTitle(title)
			} else link.classList.remove("selectedSidebarLink")
		}
	}

	function getToolsMenuLinks() {
		return [{
			name: globalize.translate("TabServer")
		}, {
			name: globalize.translate("TabDashboard"),
			href: "dashboard.html",
			pageIds: ["dashboardPage"],
			icon: "dashboard"
		}, {
			name: globalize.translate("TabSettings"),
			href: "dashboardgeneral.html",
			pageIds: ["dashboardGeneralPage"],
			icon: "settings"
		}, {
			name: globalize.translate("TabUsers"),
			href: "userprofiles.html",
			pageIds: ["userProfilesPage", "newUserPage", "editUserPage", "userLibraryAccessPage", "userParentalControlPage", "userPasswordPage"],
			icon: "people"
		}, {
			name: "Emby Premiere",
			href: "supporterkey.html",
			pageIds: ["supporterKeyPage"],
			icon: "star"
		}, {
			name: globalize.translate("TabLibrary"),
			href: "library.html",
			pageIds: ["mediaLibraryPage", "librarySettingsPage", "libraryDisplayPage", "metadataImagesConfigurationPage", "metadataNfoPage"],
			icon: "folder",
			color: "#38c"
		}, {
			name: globalize.translate("TabSubtitles"),
			href: "metadatasubtitles.html",
			pageIds: ["metadataSubtitlesPage"],
			icon: "closed_caption"
		}, {
			name: globalize.translate("TabPlayback"),
			icon: "play_circle_filled",
			color: "#E5342E",
			href: "cinemamodeconfiguration.html",
			pageIds: ["cinemaModeConfigurationPage", "playbackConfigurationPage", "streamingSettingsPage"]
		}, {
			name: globalize.translate("TabTranscoding"),
			icon: "transform",
			href: "encodingsettings.html",
			pageIds: ["encodingSettingsPage"]
		}, {
			divider: !0,
			name: globalize.translate("TabDevices")
		}, {
			name: globalize.translate("TabDevices"),
			href: "devices.html",
			pageIds: ["devicesPage", "devicePage"],
			icon: "tablet"
		}, {
			name: globalize.translate("HeaderDownloadSync"),
			icon: "file_download",
			href: "syncactivity.html",
			pageIds: ["syncActivityPage", "syncJobPage", "syncSettingsPage"],
			color: "#009688"
		}, {
			name: globalize.translate("TabCameraUpload"),
			href: "devicesupload.html",
			pageIds: ["devicesUploadPage"],
			icon: "photo_camera"
		}, {
			divider: !0,
			name: globalize.translate("TabExtras")
		}, {
			name: globalize.translate("TabAutoOrganize"),
			color: "#01C0DD",
			href: "autoorganizelog.html",
			pageIds: ["libraryFileOrganizerPage", "libraryFileOrganizerSmartMatchPage", "libraryFileOrganizerLogPage"],
			icon: "folder"
		}, {
			name: globalize.translate("DLNA"),
			href: "dlnasettings.html",
			pageIds: ["dlnaSettingsPage", "dlnaProfilesPage", "dlnaProfilePage"],
			icon: "settings"
		}, {
			name: globalize.translate("TabLiveTV"),
			href: "livetvstatus.html",
			pageIds: ["liveTvStatusPage", "liveTvSettingsPage", "liveTvTunerPage"],
			icon: "dvr"
		}, {
			name: globalize.translate("TabNotifications"),
			icon: "notifications",
			color: "brown",
			href: "notificationsettings.html",
			pageIds: ["notificationSettingsPage", "notificationSettingPage"]
		}, {
			name: globalize.translate("TabPlugins"),
			icon: "add_shopping_cart",
			color: "#9D22B1",
			href: "plugins.html",
			pageIds: ["pluginsPage", "pluginCatalogPage"]
		}, {
			divider: !0,
			name: globalize.translate("TabExpert")
		}, {
			name: globalize.translate("TabAdvanced"),
			icon: "settings",
			href: "dashboardhosting.html",
			color: "#F16834",
			pageIds: ["dashboardHostingPage", "serverSecurityPage"]
		}, {
			name: globalize.translate("TabLogs"),
			href: "log.html",
			pageIds: ["logPage"],
			icon: "folder_open"
		}, {
			name: globalize.translate("TabScheduledTasks"),
			href: "scheduledtasks.html",
			pageIds: ["scheduledTasksPage", "scheduledTaskPage"],
			icon: "schedule"
		}, {
			name: globalize.translate("MetadataManager"),
			href: "edititemmetadata.html",
			pageIds: [],
			icon: "mode_edit"
		}, {
			name: globalize.translate("ButtonReports"),
			href: "reports.html",
			pageIds: [],
			icon: "insert_chart"
		}]
	}

	function getToolsLinkHtml(item) {
		var menuHtml = "",
			pageIds = item.pageIds ? item.pageIds.join(",") : "";
		return pageIds = pageIds ? ' data-pageids="' + pageIds + '"' : "", menuHtml += '<a class="sidebarLink" href="' + item.href + '"' + pageIds + ">", item.icon && (menuHtml += '<i class="md-icon sidebarLinkIcon">' + item.icon + "</i>"), menuHtml += '<span class="sidebarLinkText">', menuHtml += item.name, menuHtml += "</span>", menuHtml += "</a>"
	}

	function getToolsMenuHtml() {
		var i, length, item, items = getToolsMenuLinks(),
			menuHtml = "";
		for (menuHtml += '<div class="drawerContent">', i = 0, length = items.length; i < length; i++) item = items[i], item.divider && (menuHtml += "<div class='sidebarDivider'></div>"), item.href ? menuHtml += getToolsLinkHtml(item) : item.name && (menuHtml += '<div class="sidebarHeader">', menuHtml += item.name, menuHtml += "</div>");
		return menuHtml += "</div>"
	}

	function createDashboardMenu() {
		var html = "";
		html += '<a class="adminDrawerLogo clearLink" is="emby-linkbutton" href="home.html" style="text-align:left;">', html += '<img src="css/images/logoblack.png" />', html += "</a>", html += getToolsMenuHtml(), html = html.split("href=").join('onclick="return LibraryMenu.onLinkClicked(event, this);" href='), navDrawerScrollContainer.innerHTML = html, updateDashboardMenuSelectedItem()
	}

	function onSidebarLinkClick() {
		var section = this.getElementsByClassName("sectionName")[0],
			text = section ? section.innerHTML : this.innerHTML;
		LibraryMenu.setTitle(text)
	}

	function getUserViews(apiClient, userId) {
		return apiClient.getUserViews({}, userId).then(function (result) {
			for (var items = result.Items, list = [], i = 0, length = items.length; i < length; i++) {
				var view = items[i];
				if (list.push(view), "livetv" == view.CollectionType) {
					view.ImageTags = {}, view.icon = "live_tv";
					var guideView = Object.assign({}, view);
					guideView.Name = globalize.translate("ButtonGuide"), guideView.ImageTags = {}, guideView.icon = "dvr", guideView.url = "livetv.html?tab=1", list.push(guideView)
				}
			}
			return list
		})
	}

	function showBySelector(selector, show) {
		var elem = document.querySelector(selector);
		elem && (show ? elem.classList.remove("hide") : elem.classList.add("hide"))
	}

	function updateLibraryMenu(user) {
		if (!user) return showBySelector(".libraryMenuDownloads", !1), showBySelector(".lnkSyncToOtherDevices", !1), void showBySelector(".userMenuOptions", !1);
		user.Policy.EnableContentDownloading ? showBySelector(".lnkSyncToOtherDevices", !0) : showBySelector(".lnkSyncToOtherDevices", !1), user.Policy.EnableContentDownloading && appHost.supports("sync") ? showBySelector(".libraryMenuDownloads", !0) : showBySelector(".libraryMenuDownloads", !1);
		var userId = Dashboard.getCurrentUserId(),
			apiClient = window.ApiClient,
			libraryMenuOptions = document.querySelector(".libraryMenuOptions");
		libraryMenuOptions && getUserViews(apiClient, userId).then(function (result) {
			var items = result,
				html = "";
			html += '<div class="sidebarHeader">', html += globalize.translate("HeaderMedia"), html += "</div>", html += items.map(function (i) {
				var icon = "folder",
					color = "inherit",
					itemId = i.Id;
				"channels" == i.CollectionType ? itemId = "channels" : "livetv" == i.CollectionType && (itemId = "livetv"), "photos" == i.CollectionType ? (icon = "photo_library", color = "#009688") : "music" == i.CollectionType || "musicvideos" == i.CollectionType ? (icon = "library_music", color = "#FB8521") : "books" == i.CollectionType ? (icon = "library_books", color = "#1AA1E1") : "playlists" == i.CollectionType ? (icon = "view_list", color = "#795548") : "games" == i.CollectionType ? (icon = "games", color = "#F44336") : "movies" == i.CollectionType ? (icon = "video_library", color = "#CE5043") : "channels" == i.CollectionType || "Channel" == i.Type ? (icon = "videocam", color = "#E91E63") : "tvshows" == i.CollectionType ? (icon = "tv", color = "#4CAF50") : "livetv" == i.CollectionType && (icon = "live_tv", color = "#293AAE"), icon = i.icon || icon;
				var onclick = i.onclick ? " function(){" + i.onclick + "}" : "null";
				return '<a data-itemid="' + itemId + '" class="lnkMediaFolder sidebarLink" onclick="return LibraryMenu.onLinkClicked(event, this, ' + onclick + ');" href="' + getItemHref(i, i.CollectionType) + '"><i class="md-icon sidebarLinkIcon">' + icon + '</i><span class="sectionName">' + i.Name + "</span></a>"
			}).join(""), libraryMenuOptions.innerHTML = html;
			for (var elem = libraryMenuOptions, sidebarLinks = elem.querySelectorAll(".sidebarLink"), i = 0, length = sidebarLinks.length; i < length; i++) sidebarLinks[i].removeEventListener("click", onSidebarLinkClick), sidebarLinks[i].addEventListener("click", onSidebarLinkClick)
		})
	}

	function onManageServerClicked() {
		closeMainDrawer(), Dashboard.navigate("dashboard.html")
	}

	function getTopParentId() {
		return getParameterByName("topParentId") || null
	}

	function getNavigateDelay() {
		return browser.slow ? 320 : 200
	}

	function updateCastIcon() {
		var context = document,
			btnCast = context.querySelector(".btnCast");
		if (btnCast) {
			var info = playbackManager.getPlayerInfo();
			info && !info.isLocalPlayer ? (btnCast.querySelector("i").innerHTML = "&#xE308;", btnCast.classList.add("btnActiveCast"), context.querySelector(".headerSelectedPlayer").innerHTML = info.deviceName || info.name) : (btnCast.querySelector("i").innerHTML = "&#xE307;", btnCast.classList.remove("btnActiveCast"), context.querySelector(".headerSelectedPlayer").innerHTML = "")
		}
	}

	function updateLibraryNavLinks(page) {
		var i, length, isLiveTvPage = page.classList.contains("liveTvPage"),
			isChannelsPage = page.classList.contains("channelsPage"),
			isEditorPage = page.classList.contains("metadataEditorPage"),
			isReportsPage = page.classList.contains("reportsPage"),
			isMySyncPage = page.classList.contains("mySyncPage"),
			id = isLiveTvPage || isChannelsPage || isEditorPage || isReportsPage || isMySyncPage || page.classList.contains("allLibraryPage") ? "" : getTopParentId() || "",
			elems = document.getElementsByClassName("lnkMediaFolder");
		for (i = 0, length = elems.length; i < length; i++) {
			var lnkMediaFolder = elems[i],
				itemId = lnkMediaFolder.getAttribute("data-itemid");
			isChannelsPage && "channels" == itemId ? lnkMediaFolder.classList.add("selectedMediaFolder") : isLiveTvPage && "livetv" == itemId ? lnkMediaFolder.classList.add("selectedMediaFolder") : isEditorPage && "editor" == itemId ? lnkMediaFolder.classList.add("selectedMediaFolder") : isReportsPage && "reports" == itemId ? lnkMediaFolder.classList.add("selectedMediaFolder") : isMySyncPage && "manageoffline" == itemId && window.location.href.toString().indexOf("mode=offline") != -1 ? lnkMediaFolder.classList.add("selectedMediaFolder") : isMySyncPage && "syncotherdevices" == itemId && window.location.href.toString().indexOf("mode=offline") == -1 ? lnkMediaFolder.classList.add("selectedMediaFolder") : id && itemId == id ? lnkMediaFolder.classList.add("selectedMediaFolder") : lnkMediaFolder.classList.remove("selectedMediaFolder")
		}
	}

	function onWebSocketMessage(e, data) {
		var msg = data;
		"UserConfigurationUpdated" === msg.MessageType && msg.Data.Id == Dashboard.getCurrentUserId()
	}

	function updateViewMenuBar(page) {
		page.classList.contains("standalonePage") ? skinHeader.classList.add("hide") : skinHeader.classList.remove("hide"), page.classList.contains("type-interior") && !layoutManager.mobile ? skinHeader.classList.add("headroomDisabled") : skinHeader.classList.remove("headroomDisabled"), requiresUserRefresh && connectionManager.user(window.ApiClient).then(updateUserInHeader)
	}

	function updateTitle(page) {
		var title = page.getAttribute("data-title");
		title && LibraryMenu.setTitle(title)
	}

	function updateBackButton(page) {
		headerBackButton || (headerBackButton = document.querySelector(".headerBackButton")), headerBackButton && ("false" !== page.getAttribute("data-backbutton") && embyRouter.canGoBack() ? headerBackButton.classList.remove("hide") : headerBackButton.classList.add("hide"))
	}

	function initHeadRoom(elem) {
		require(["headroom-window"], function (headroom) {
			headroom.add(elem)
		})
	}

	function initializeApiClient(apiClient) {
		events.off(apiClient, "websocketmessage", onWebSocketMessage), events.on(apiClient, "websocketmessage", onWebSocketMessage)
	}

	function setDrawerClass(page) {
		var admin = !1;
		page || (page = viewManager.currentView()), page && page.classList.contains("type-interior") && (admin = !0), loadNavDrawer(), admin ? (navDrawerElement.classList.add("adminDrawer"), navDrawerElement.classList.remove("darkDrawer")) : (navDrawerElement.classList.add("darkDrawer"), navDrawerElement.classList.remove("adminDrawer"))
	}

	function refreshLibraryDrawer(user) {
		loadNavDrawer(), currentDrawerType = "library";
		var promise = user ? Promise.resolve(user) : connectionManager.user(window.ApiClient);
		promise.then(function (user) {
			refreshLibraryInfoInDrawer(user), updateLibraryMenu(user.localUser)
		})
	}

	function getNavDrawerOptions() {
		var drawerWidth = screen.availWidth - 50;
		return drawerWidth = Math.max(drawerWidth, 240), drawerWidth = Math.min(drawerWidth, 320), {
			target: navDrawerElement,
			onChange: onMainDrawerSelect,
			width: drawerWidth
		}
	}

	function loadNavDrawer() {
		return navDrawerInstance ? Promise.resolve(navDrawerInstance) : (navDrawerElement = document.querySelector(".mainDrawer"), navDrawerScrollContainer = navDrawerElement.querySelector(".scrollContainer"), new Promise(function (resolve, reject) {
			require(["navdrawer"], function (navdrawer) {
				navDrawerInstance = new navdrawer(getNavDrawerOptions()), navDrawerElement.classList.remove("hide"), resolve(navDrawerInstance)
			})
		}))
	}
	var navDrawerElement, navDrawerScrollContainer, navDrawerInstance, mainDrawerButton, btnHome, currentDrawerType, pageTitleElement, headerBackButton, enableLibraryNavDrawer = layoutManager.desktop,
		skinHeader = document.querySelector(".skinHeader"),
		requiresUserRefresh = !0,
		lastOpenTime = (new Date).getTime();
	return window.LibraryMenu = {
		getTopParentId: getTopParentId,
		onLinkClicked: function (event, link, action) {
			return 1 != event.which || ((new Date).getTime() - lastOpenTime > 200 && setTimeout(function () {
				closeMainDrawer(), setTimeout(function () {
					action ? action() : Dashboard.navigate(link.href)
				}, getNavigateDelay())
			}, 50), event.stopPropagation(), event.preventDefault(), !1)
		},
		onLogoutClicked: function () {
			return (new Date).getTime() - lastOpenTime > 200 && (closeMainDrawer(), setTimeout(function () {
				Dashboard.logout()
			}, getNavigateDelay())), !1
		},
		onHardwareMenuButtonClick: function () {
			toggleMainDrawer()
		},
		onSettingsClicked: function (event) {
			return 1 != event.which || (Dashboard.navigate("dashboard.html"), !1)
		},
		setTabs: function (type, selectedIndex, builder) {
			require(["mainTabsManager"], function (mainTabsManager) {
				type ? mainTabsManager.setTabs(viewManager.currentView(), selectedIndex, builder) : mainTabsManager.setTabs(null)
			})
		},
		setDefaultTitle: function () {
			pageTitleElement || (pageTitleElement = document.querySelector(".pageTitle")), pageTitleElement && (pageTitleElement.classList.add("pageTitleWithLogo"), pageTitleElement.classList.add("pageTitleWithDefaultLogo"), pageTitleElement.style.backgroundImage = "url(css/images/logo.png)", pageTitleElement.innerHTML = ""), document.title = "Emby"
		},
		setTitle: function (title) {
			var html = title,
				page = viewManager.currentView();
			if (page) {
				var helpUrl = page.getAttribute("data-helpurl");
				helpUrl && (html += '<a href="' + helpUrl + '" target="_blank" is="emby-linkbutton" class="button-link" style="margin-left:2em;" title="' + globalize.translate("ButtonHelp") + '"><i class="md-icon">info</i><span>' + globalize.translate("ButtonHelp") + "</span></a>")
			}
			pageTitleElement || (pageTitleElement = document.querySelector(".pageTitle")), pageTitleElement && (pageTitleElement.classList.remove("pageTitleWithLogo"), pageTitleElement.classList.remove("pageTitleWithDefaultLogo"), pageTitleElement.style.backgroundImage = null, pageTitleElement.innerHTML = html), document.title = title || "Emby"
		},
		setTransparentMenu: function (transparent) {
			transparent ? skinHeader.classList.add("semiTransparent") : skinHeader.classList.remove("semiTransparent")
		}
	}, pageClassOn("pagebeforeshow", "page", function (e) {
		var page = this;
		page.classList.contains("withTabs") || LibraryMenu.setTabs(null)
	}), pageClassOn("pageshow", "page", function (e) {
		var page = this;
		btnHome && ("indexPage" === page.id ? btnHome.classList.add("hide") : btnHome.classList.remove("hide"));
		var isDashboardPage = page.classList.contains("type-interior");
		isDashboardPage ? (mainDrawerButton && mainDrawerButton.classList.remove("hide"), refreshDashboardInfoInDrawer(page)) : (mainDrawerButton && (enableLibraryNavDrawer ? mainDrawerButton.classList.remove("hide") : mainDrawerButton.classList.add("hide")), "library" !== currentDrawerType && refreshLibraryDrawer()), setDrawerClass(page), updateViewMenuBar(page), e.detail.isRestored || window.scrollTo(0, 0), updateTitle(page), updateBackButton(page), page.classList.contains("libraryPage") ? (document.body.classList.add("libraryDocument"), document.body.classList.remove("dashboardDocument"), document.body.classList.remove("hideMainDrawer"), navDrawerInstance && navDrawerInstance.setEdgeSwipeEnabled(!0)) : isDashboardPage ? (document.body.classList.remove("libraryDocument"), document.body.classList.add("dashboardDocument"), document.body.classList.remove("hideMainDrawer"), navDrawerInstance && navDrawerInstance.setEdgeSwipeEnabled(!0)) : (document.body.classList.remove("libraryDocument"), document.body.classList.remove("dashboardDocument"), document.body.classList.add("hideMainDrawer"), navDrawerInstance && navDrawerInstance.setEdgeSwipeEnabled(!1)), updateLibraryNavLinks(page)
	}), window.ApiClient && initializeApiClient(window.ApiClient), renderHeader(), events.on(connectionManager, "apiclientcreated", function (e, apiClient) {
		initializeApiClient(apiClient)
	}), events.on(connectionManager, "localusersignedin", function (e, user) {
		currentDrawerType = null, setDrawerClass(), connectionManager.user(connectionManager.getApiClient(user.ServerId)).then(function (user) {
			updateUserInHeader(user)
		})
	}), events.on(connectionManager, "localusersignedout", updateUserInHeader), events.on(playbackManager, "playerchange", updateCastIcon), setDrawerClass(), LibraryMenu
});