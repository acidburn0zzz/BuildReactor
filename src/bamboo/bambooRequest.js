define([
		'signals',
		'ajaxRequest',
		'amdUtils/string/endsWith',
		'amdUtils/string/interpolate'
	], function (signals, AjaxRequest, endsWith, interpolate) {

		'use strict';
		
		var ajaxOptions = {
			sessionCookie: 'JSESSIONID'
		};

		var BambooRequest = function (settings) {
			if (!(this instanceof BambooRequest)) {
				return new BambooRequest(settings);
			}
			if (!(settings && settings.url && settings.url !== '')) {
				throw {
					name: 'ArgumentInvalid',
					message: 'settings.url not set'
				};
			}
			this.settings = settings;
			this.on = {
				responseReceived: new signals.Signal(),
				errorReceived: new signals.Signal()
			};
			
		};

		function createAjaxRequestSettings(settings, urlPath) {
			var url = settings.url;
			if (!endsWith(url, '/')) { url += '/'; }
			url += 'rest/api/latest/' + urlPath;
			return {
				url: url,
				username: settings.username,
				password: settings.password
			};
		}

		BambooRequest.prototype.send = function (urlPath) {
			var ajaxSettings = createAjaxRequestSettings(this.settings, urlPath);
			var request = new AjaxRequest(ajaxSettings, ajaxOptions);
			request.on.responseReceived.addOnce(function (response) {
				this.on.responseReceived.dispatch(response);
			}, this);
			request.on.errorReceived.addOnce(function (ajaxError) {
				this.on.errorReceived.dispatch(ajaxError);
			}, this);
			request.send();
		};

		BambooRequest.prototype.projects = function () {
			this.send('project?expand=projects.project.plans.plan');
		};

		BambooRequest.prototype.latestPlanResult = function (planKey) {
			var urlPath = interpolate('result/{{0}}/latest?expand=jiraIssues,changes.change', [planKey]);
			this.send(urlPath);
		};

		BambooRequest.prototype.plan = function () {
		};

		return BambooRequest;
	});