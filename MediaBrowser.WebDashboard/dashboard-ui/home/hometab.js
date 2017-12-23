define(["userSettings", "loading", "connectionManager", "apphost", "layoutManager", "focusManager", "homeSections", "emby-itemscontainer"], function(userSettings, loading, connectionManager, appHost, layoutManager, focusManager, homeSections) {
    "use strict";

    function HomeTab(view, params) {
        this.view = view, this.params = params, this.apiClient = connectionManager.currentApiClient(), this.sectionsContainer = view.querySelector(".sections"), view.querySelector(".sections").addEventListener("settingschange", onHomeScreenSettingsChanged.bind(this))
    }

    function onHomeScreenSettingsChanged() {
        this.sectionsRendered = !1, this.paused || this.onResume({
            refresh: !0
        })
    }
	
	//myproduction-change-start
	//Added statistics overview
	function germanDate(dateObject)
	{
		return ("0" + dateObject.getDate().toString()).substr(-2) + "." + ("0" + (dateObject.getMonth() + 1).toString()).substr(-2) + "." + dateObject.getFullYear().toString();
	}

	function germanTime(dateObject)
	{
		return ("0" + dateObject.getHours().toString()).substr(-2) + ":" + ("0" + dateObject.getMinutes().toString()).substr(-2);
	}

	function germanDuration(ticks)
	{
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

	function humanFileSize(size)
	{
		var i = Math.floor(Math.log(size) / Math.log(1024));
		var sizeString = (size / Math.pow(1024, i)).toFixed(2) * 1 + " " + ["B", "kB", "MB", "GB", "TB"][i];
		return sizeString.replace(".", ",");
	}
	//myproduction-change-end
	
    return HomeTab.prototype.onResume = function(options) {
        if (this.sectionsRendered) {
            var sectionsContainer = this.sectionsContainer;
            return sectionsContainer ? homeSections.resume(sectionsContainer, options) : Promise.resolve()
        }
        loading.show();
        var view = this.view,
            apiClient = this.apiClient;
        return this.destroyHomeSections(), this.sectionsRendered = !0, apiClient.getCurrentUser().then(function(user) {
            return homeSections.loadSections(view.querySelector(".sections"), apiClient, user, userSettings).then(function() {
                options.autoFocus && focusManager.autoFocus(view), loading.hide(), 
				
				//myproduction-change-start
				//Added statistics overview
				ApiClient.getItemCounts().then(function (itemCounts) {
					document.getElementById("statisticsMovieCount").textContent = itemCounts.MovieCount;
					document.getElementById("statisticsSeriesCount").textContent = itemCounts.SeriesCount;
					document.getElementById("statisticsEpisodesCount").textContent = itemCounts.EpisodeCount;

					document.getElementById("statisticsTotalRunTime").textContent = germanDuration(itemCounts.LibraryStatistics.TotalRunTimeTicks);
					document.getElementById("statisticsTotalFileSize").textContent = humanFileSize(itemCounts.LibraryStatistics.TotalFileSize);
					document.getElementById("statisticsTotalFileSizeWithRedundancy").textContent = humanFileSize(itemCounts.LibraryStatistics.TotalFileSizeWithRedundancy);
				});
				//myproduction-change-end
            })
        })
    }, HomeTab.prototype.onPause = function() {
        var sectionsContainer = this.sectionsContainer;
        sectionsContainer && homeSections.pause(sectionsContainer)
    }, HomeTab.prototype.destroy = function() {
        this.view = null, this.params = null, this.apiClient = null, this.destroyHomeSections(), this.sectionsContainer = null
    }, HomeTab.prototype.destroyHomeSections = function() {
        var sectionsContainer = this.sectionsContainer;
        sectionsContainer && homeSections.destroySections(sectionsContainer)
    }, HomeTab
});