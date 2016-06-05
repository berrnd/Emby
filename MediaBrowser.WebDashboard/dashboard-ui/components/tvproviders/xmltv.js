﻿define(['jQuery', 'paper-checkbox', 'paper-button', 'emby-input', 'paper-item-body', 'paper-icon-item', 'paper-icon-button-light'], function ($) {

    return function (page, providerId, options) {

        var self = this;

        function getListingProvider(config, id) {

            if (config && id) {
                return config.ListingProviders.filter(function (i) {
                    return i.Id == id;
                })[0] || getListingProvider();
            }

            return ApiClient.getJSON(ApiClient.getUrl('LiveTv/ListingProviders/Default'));
        }

        function reload() {

            Dashboard.showLoadingMsg();

            ApiClient.getNamedConfiguration("livetv").then(function (config) {

                getListingProvider(config, providerId).then(function (info) {
                    page.querySelector('.txtPath').value = info.Path || '';
                    page.querySelector('.txtKids').value = (info.KidsGenres || []).join('|');
                    page.querySelector('.txtNews').value = (info.NewsGenres || []).join('|');
                    page.querySelector('.txtSports').value = (info.SportsGenres || []).join('|');

                    page.querySelector('.chkAllTuners').checked = info.EnableAllTuners;

                    if (page.querySelector('.chkAllTuners').checked) {
                        page.querySelector('.selectTunersSection').classList.add('hide');
                    } else {
                        page.querySelector('.selectTunersSection').classList.remove('hide');
                    }

                    refreshTunerDevices(page, info, config.TunerHosts);
                    Dashboard.hideLoadingMsg();
                });
            });
        }

        function getGenres(txtInput) {

            var value = txtInput.value;

            return value ? value.split('|') : [];
        }

        function submitListingsForm() {

            Dashboard.showLoadingMsg();

            var id = providerId;

            ApiClient.getNamedConfiguration("livetv").then(function (config) {

                var info = config.ListingProviders.filter(function (i) {
                    return i.Id == id;
                })[0] || {};

                info.Type = 'xmltv';

                info.Path = page.querySelector('.txtPath').value;

                info.KidsGenres = getGenres(page.querySelector('.txtKids'));
                info.NewsGenres = getGenres(page.querySelector('.txtNews'));
                info.SportsGenres = getGenres(page.querySelector('.txtSports'));

                info.EnableAllTuners = page.querySelector('.chkAllTuners').checked;
                info.EnabledTuners = info.EnableAllTuners ? [] : $('.chkTuner', page).get().filter(function (i) {
                    return i.checked;
                }).map(function (i) {
                    return i.getAttribute('data-id');
                });

                ApiClient.ajax({
                    type: "POST",
                    url: ApiClient.getUrl('LiveTv/ListingProviders', {
                        ValidateListings: true
                    }),
                    data: JSON.stringify(info),
                    contentType: "application/json"

                }).then(function (result) {

                    Dashboard.hideLoadingMsg();
                    if (options.showConfirmation !== false) {
                        Dashboard.processServerConfigurationUpdateResult();
                    }
                    Events.trigger(self, 'submitted');

                }, function () {
                    Dashboard.hideLoadingMsg();
                    Dashboard.alert({
                        message: Globalize.translate('ErrorAddingListingsToSchedulesDirect')
                    });
                });

            });
        }

        function getTunerName(providerId) {

            providerId = providerId.toLowerCase();

            switch (providerId) {

                case 'm3u':
                    return 'M3U Playlist';
                case 'hdhomerun':
                    return 'HDHomerun';
                case 'satip':
                    return 'DVB';
                default:
                    return 'Unknown';
            }
        }

        function refreshTunerDevices(page, providerInfo, devices) {

            var html = '';

            for (var i = 0, length = devices.length; i < length; i++) {

                var device = devices[i];

                html += '<paper-icon-item>';

                var enabledTuners = providerInfo.EnableAllTuners || [];
                var isChecked = providerInfo.EnableAllTuners || enabledTuners.indexOf(device.Id) != -1;
                var checkedAttribute = isChecked ? ' checked' : '';
                html += '<paper-checkbox data-id="' + device.Id + '" class="chkTuner" item-icon ' + checkedAttribute + '></paper-checkbox>';

                html += '<paper-item-body two-line>';
                html += '<div>';
                html += device.FriendlyName || getTunerName(device.Type);
                html += '</div>';

                html += '<div secondary>';
                html += device.Url;
                html += '</div>';
                html += '</paper-item-body>';

                html += '</paper-icon-item>';
            }

            page.querySelector('.tunerList').innerHTML = html;
        }

        self.submit = function () {
            page.querySelector('.btnSubmitListingsContainer').click();
        };

        function onSelectPathClick(e) {
            var page = $(e.target).parents('.xmltvForm')[0];
            require(['directorybrowser'], function (directoryBrowser) {

                var picker = new directoryBrowser();

                picker.show({

                    includeFiles: true,
                    callback: function (path) {

                        if (path) {
                            var txtPath = page.querySelector('.txtPath');
                            txtPath.value = path;
                            txtPath.focus();
                        }
                        picker.close();
                    }
                });
            });
        }

        self.init = function () {

            options = options || {};

            if (options.showCancelButton !== false) {
                page.querySelector('.btnCancel').classList.remove('hide');
            } else {
                page.querySelector('.btnCancel').classList.add('hide');
            }

            if (options.showSubmitButton !== false) {
                page.querySelector('.btnSubmitListings').classList.remove('hide');
            } else {
                page.querySelector('.btnSubmitListings').classList.add('hide');
            }

            $('form', page).on('submit', function () {
                submitListingsForm();
                return false;
            });

            page.querySelector('#btnSelectPath').addEventListener("click", onSelectPathClick);

            page.querySelector('.chkAllTuners').addEventListener('change', function (e) {
                if (e.target.checked) {
                    page.querySelector('.selectTunersSection').classList.add('hide');
                } else {
                    page.querySelector('.selectTunersSection').classList.remove('hide');
                }
            });

            reload();
        };
    }
});