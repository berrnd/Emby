define(["loading", "libraryBrowser", "libraryMenu", "playbackManager", "mainTabsManager", "homeSections", "globalize", "apphost", "serverNotifications", "events", "emby-button"], function (loading, libraryBrowser, libraryMenu, playbackManager, mainTabsManager, homeSections, globalize, appHost, serverNotifications, events) {
	"use strict";

	function displayPreferencesKey() {
		return AppInfo.isNativeApp ? "Emby Mobile" : "webclient"
	}

	function dismissWelcome(page, userId) {
		var apiClient = ApiClient;
		getDisplayPreferences(apiClient, "home", userId).then(function (result) {
			result.CustomPrefs[homePageTourKey] = homePageDismissValue, apiClient.updateDisplayPreferences("home", result, userId, displayPreferencesKey())
		})
	}

	function showWelcomeIfNeeded(page, displayPreferences) {
		if (displayPreferences.CustomPrefs[homePageTourKey] == homePageDismissValue) page.querySelector(".welcomeMessage").classList.add("hide");
		else {
			loading.hide();
			var elem = page.querySelector(".welcomeMessage");
			elem.classList.remove("hide"), displayPreferences.CustomPrefs[homePageTourKey] ? (elem.querySelector(".tourHeader").innerHTML = globalize.translate("HeaderWelcomeBack"), elem.querySelector(".tourButtonText").innerHTML = globalize.translate("ButtonTakeTheTourToSeeWhatsNew")) : (elem.querySelector(".tourHeader").innerHTML = globalize.translate("HeaderWelcomeToProjectWebClient"), elem.querySelector(".tourButtonText").innerHTML = globalize.translate("ButtonTakeTheTour"))
		}
	}

	function takeTour(page, userId) {
		require(["slideshow"], function () {
			var slides = [{
				imageUrl: "css/images/tour/web/tourcontent.jpg",
				title: globalize.translate("WebClientTourContent")
			}, {
				imageUrl: "css/images/tour/web/tourmovies.jpg",
				title: globalize.translate("WebClientTourMovies")
			}, {
				imageUrl: "css/images/tour/web/tourmouseover.jpg",
				title: globalize.translate("WebClientTourMouseOver")
			}, {
				imageUrl: "css/images/tour/web/tourtaphold.jpg",
				title: globalize.translate("WebClientTourTapHold")
			}, {
				imageUrl: "css/images/tour/web/tourmysync.png",
				title: globalize.translate("WebClientTourMySync")
			}, {
				imageUrl: "css/images/tour/web/toureditor.png",
				title: globalize.translate("WebClientTourMetadataManager")
			}, {
				imageUrl: "css/images/tour/web/tourplaylist.png",
				title: globalize.translate("WebClientTourPlaylists")
			}, {
				imageUrl: "css/images/tour/web/tourcollections.jpg",
				title: globalize.translate("WebClientTourCollections")
			}, {
				imageUrl: "css/images/tour/web/tourusersettings1.png",
				title: globalize.translate("WebClientTourUserPreferences1")
			}, {
				imageUrl: "css/images/tour/web/tourusersettings2.png",
				title: globalize.translate("WebClientTourUserPreferences2")
			}, {
				imageUrl: "css/images/tour/web/tourusersettings3.png",
				title: globalize.translate("WebClientTourUserPreferences3")
			}, {
				imageUrl: "css/images/tour/web/tourusersettings4.png",
				title: globalize.translate("WebClientTourUserPreferences4")
			}, {
				imageUrl: "css/images/tour/web/tourmobile1.jpg",
				title: globalize.translate("WebClientTourMobile1")
			}, {
				imageUrl: "css/images/tour/web/tourmobile2.png",
				title: globalize.translate("WebClientTourMobile2")
			}, {
				imageUrl: "css/images/tour/enjoy.jpg",
				title: globalize.translate("MessageEnjoyYourStay")
			}];
			require(["slideshow"], function (slideshow) {
				var newSlideShow = new slideshow({
					slides: slides,
					interactive: !0,
					loop: !1
				});
				newSlideShow.show(), dismissWelcome(page, userId), page.querySelector(".welcomeMessage").classList.add("hide")
			})
		})
	}

	function getRequirePromise(deps) {
		return new Promise(function (resolve, reject) {
			require(deps, resolve)
		})
	}

	function loadHomeTab(page, tabContent) {
		var apiClient = ApiClient;
		if (apiClient) {
			var userId = Dashboard.getCurrentUserId();
			loading.show();
			var promises = [Dashboard.getCurrentUser(), getRequirePromise(["userSettings"])];
			Promise.all(promises).then(function (responses) {
				var user = responses[0],
					userSettings = responses[1];
				homeSections.loadSections(tabContent.querySelector(".sections"), apiClient, user, userSettings).then(function () {
					loading.hide()

					//myproduction-change-start
					//Added statistics overview
					ApiClient.getItemCounts().then(function (itemCounts) {
						document.getElementById("statisticsMovieCount").textContent = itemCounts.MovieCount;
						document.getElementById("statisticsSeriesCount").textContent = itemCounts.SeriesCount;
						document.getElementById("statisticsEpisodesCount").textContent = itemCounts.EpisodeCount;

						document.getElementById("statisticsTotalRunTime").textContent = germanDuration(itemCounts.LibraryStatistics.TotalRunTimeTicks);
						document.getElementById("statisticsTotalFileSize").textContent = humanFileSize(itemCounts.LibraryStatistics.TotalFileSize);
					});
					//myproduction-change-end
				})
			}), AppInfo.isNativeApp || getDisplayPreferences(apiClient, "home", userId).then(function (displayPreferences) {
				showWelcomeIfNeeded(page, displayPreferences)
			})
		}
	}

	//myproduction-change-start
	//Added statistics overview
	function germanDate(dateObject) {
		return ("0" + dateObject.getDate().toString()).substr(-2) + "." + ("0" + (dateObject.getMonth() + 1).toString()).substr(-2) + "." + dateObject.getFullYear().toString();
	}

	function germanTime(dateObject) {
		return ("0" + dateObject.getHours().toString()).substr(-2) + ":" + ("0" + dateObject.getMinutes().toString()).substr(-2);
	}

	function germanDuration(ticks) {
		var totalSeconds = ticks / 1000 / 1000;
		var years = Math.floor(totalSeconds / 31536000);
		var days = Math.floor((totalSeconds % 31536000) / 86400);
		var hours = Math.floor(((totalSeconds % 31536000) % 86400) / 3600);
		//var minutes = Math.floor((((totalSeconds % 31536000) % 86400) % 3600) / 60);

		var yearTxt = "Jahre";
		if (years == 1) {
			yearTxt = "Jahr";
		}

		var dayTxt = "Tage";
		if (days == 1) {
			dayTxt = "Tag";
		}

		var hourTxt = "Stunden";
		if (hours == 1) {
			hourTxt = "Stunde";
		}

		//var minuteTxt = "Minuten";
		//if (minutes == 1)
		//{
		//	hourTxt = "Minute";
		//}

		return years.toString() + " " + yearTxt + ", " + days.toString() + " " + dayTxt + ", " + hours.toString() + " " + hourTxt + "";
	}

	function humanFileSize(size) {
		var i = Math.floor(Math.log(size) / Math.log(1024));
		var sizeString = (size / Math.pow(1024, i)).toFixed(2) * 1 + " " + ["B", "kB", "MB", "GB", "TB"][i];
		return sizeString.replace(".", ",");
	}
	//myproduction-change-end

	function getDisplayPreferences(apiClient, key, userId) {
		return apiClient.getDisplayPreferences(key, userId, displayPreferencesKey())
	}

	function getTabs() {
		return [{
			name: globalize.translate("TabHome")
		}, {
			name: globalize.translate("TabFavorites")
		}, {
			name: globalize.translate("TabUpcoming")
		}, {
			name: globalize.translate("ButtonSearch")
		}]
	}
	var homePageDismissValue = "14",
		homePageTourKey = "homePageTour";
	return function (view, params) {
		function onBeforeTabChange(e) {
			preLoadTab(view, parseInt(e.detail.selectedTabIndex))
		}

		function onTabChange(e) {
			loadTab(view, parseInt(e.detail.selectedTabIndex))
		}

		function setTabsEnabled(viewTabs) {
			Dashboard.getCurrentUser().then(function (user) {
				viewTabs.setTabEnabled(1, appHost.supports("sync") && user.Policy.EnableContentDownloading)
			})
		}

		function initTabs() {
			var tabsReplaced = mainTabsManager.setTabs(view, currentTabIndex, getTabs);
			if (tabsReplaced) {
				var viewTabs = document.querySelector(".tabs-viewmenubar");
				viewTabs.addEventListener("beforetabchange", onBeforeTabChange), viewTabs.addEventListener("tabchange", onTabChange), libraryBrowser.configurePaperLibraryTabs(view, viewTabs, view.querySelectorAll(".pageTabContent"), [0, 1, 2, 3], !0), viewTabs.triggerBeforeTabChange ? setTabsEnabled(viewTabs) : viewTabs.addEventListener("ready", function () {
					setTabsEnabled(viewTabs), viewTabs.triggerBeforeTabChange()
				})
			}
		}

		function getTabController(page, index, callback) {
			var depends = [];
			switch (index) {
				case 0:
					break;
				case 1:
					depends.push("scripts/homefavorites");
					break;
				case 2:
					depends.push("scripts/tvupcoming");
					break;
				case 3:
					depends.push("scripts/searchtab");
					break;
				default:
					return
			}
			require(depends, function (controllerFactory) {
				var tabContent;
				0 == index && (tabContent = view.querySelector(".pageTabContent[data-index='" + index + "']"), self.tabContent = tabContent);
				var controller = tabControllers[index];
				controller || (tabContent = view.querySelector(".pageTabContent[data-index='" + index + "']"), controller = 0 === index ? self : 3 === index ? new controllerFactory(view, tabContent, {}) : new controllerFactory(view, params, tabContent), tabControllers[index] = controller, controller.initTab && controller.initTab()), callback(controller)
			})
		}

		function preLoadTab(page, index) {
			getTabController(page, index, function (controller) {
				renderedTabs.indexOf(index) == -1 && controller.preRender && controller.preRender()
			})
		}

		function loadTab(page, index) {
			currentTabIndex = index, getTabController(page, index, function (controller) {
				renderedTabs.indexOf(index) == -1 && (renderedTabs.push(index), controller.renderTab())
			})
		}

		function onPlaybackStop(e, state) {
			state.NowPlayingItem && "Video" == state.NowPlayingItem.MediaType && (renderedTabs = [], mainTabsManager.getTabsElement().triggerBeforeTabChange(), mainTabsManager.getTabsElement().triggerTabChange())
		}

		function onUserDataChanged(e, apiClient, userData) {
			userData.UserId == Dashboard.getCurrentUserId() && (renderedTabs = [])
		}
		var self = this,
			currentTabIndex = parseInt(params.tab || "0");
		self.renderTab = function () {
			var tabContent = view.querySelector(".pageTabContent[data-index='0']");
			loadHomeTab(view, tabContent)
		};
		var tabControllers = [],
			renderedTabs = [];
		view.querySelector(".btnTakeTour").addEventListener("click", function () {
			takeTour(view, Dashboard.getCurrentUserId())
		}), view.querySelector(".sections").addEventListener("settingschange", function () {
			renderedTabs = [], mainTabsManager.getTabsElement().triggerBeforeTabChange(), mainTabsManager.getTabsElement().triggerTabChange()
		}), view.addEventListener("viewbeforeshow", function (e) {
			initTabs(), libraryMenu.setDefaultTitle();
			var tabs = mainTabsManager.getTabsElement();
			tabs.triggerBeforeTabChange && tabs.triggerBeforeTabChange()
		}), view.addEventListener("viewshow", function (e) {
			mainTabsManager.getTabsElement().triggerTabChange(), events.on(playbackManager, "playbackstop", onPlaybackStop), events.on(serverNotifications, "UserDataChanged", onUserDataChanged)
		}), view.addEventListener("viewbeforehide", function (e) {
			events.off(playbackManager, "playbackstop", onPlaybackStop), events.off(serverNotifications, "UserDataChanged", onUserDataChanged)
		}), view.addEventListener("viewdestroy", function (e) {
			tabControllers.forEach(function (t) {
				t.destroy && t.destroy()
			})
		})
	}
});