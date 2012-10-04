define([
		'jquery',
		'optionsController',
		'settings/addService',
		'settings/serviceSettings',
		'settings/serviceOptions',
		'settings/serviceList',
		'settings/savePrompt',
		'settings/removePrompt',
		'settings/alert',
		'spec/mocks/mockSettingsBuilder',
		'jasmineSignals'
	], function ($, controller, addService, serviceSettings, serviceOptions, serviceList, savePrompt, removePrompt, alert, MockSettingsBuilder, jasmineSignals) {

		'use strict';
		
		describe('optionsController', function () {

			var spyOnSignal = jasmineSignals.spyOnSignal;

			var page = {
				getServiceName: function () {
					return $('.service-name').text();
				},
				setServiceName: function (name) {
					return $('.service-name').text(name);
				},
				isAddButtonEnabled: function (enable) {
					if (enable === undefined) {
						return !$('#service-add-button').hasClass('disabled');
					} else {
						$('#service-add-button').toggleClass('disabled', !enable);
						return undefined;
					}
				},
				isAddButtonActive: function (enable) {
					if (enable === undefined) {
						return $('#service-add-button').hasClass('btn-primary');
					} else {
						$('#service-add-button').toggleClass('btn-primary');
					}
				},
				removeService: function () {
					$('#service-remove-button').click();
				}
			};

			var spyServiceListGetSelectedName;
			var spyServiceSettingsGetAll;
			var spyServiceSettingsGetByIndex;

			beforeEach(function () {
				jasmine.getFixtures().load('optionsControllerFixture.html');
				spyOn(addService, 'show');
				spyOn(addService, 'hide');
				spyOn(addService, 'initialize');

				spyOn(savePrompt, 'initialize');
				spyOn(savePrompt, 'show');
				spyOn(savePrompt, 'hide');

				spyOn(removePrompt, 'initialize');
				spyOn(removePrompt, 'show');
				spyOn(removePrompt, 'hide');

				spyOn(alert, 'show');

				spyOn(serviceOptions, 'initialize');
				spyOn(serviceOptions, 'show');

				spyOn(serviceList, 'load');
				spyOn(serviceList, 'update');
				spyOn(serviceList, 'selectLast');
				spyOn(serviceList, 'selectItem');
				spyServiceListGetSelectedName = spyOn(serviceList, 'getSelectedName');

				spyOn(serviceSettings, 'load');
				spyOn(serviceSettings, 'clear');
				spyOn(serviceSettings, 'add');
				spyServiceSettingsGetByIndex = spyOn(serviceSettings, 'getByIndex');
				spyServiceSettingsGetAll = spyOn(serviceSettings, 'getAll');
				spyOn(serviceSettings, 'remove');
				spyOn(serviceSettings, 'update');

				controller.initialize();
			});

			afterEach(function () {
				savePrompt.removeSelected.removeAll();
				addService.on.selected.removeAll();
				removePrompt.removeSelected.removeAll();
				serviceSettings.cleared.removeAll();
				serviceList.itemClicked.removeAll();
				serviceList.itemSelected.removeAll();
				serviceOptions.on.updated.removeAll();
			});

			var createItem = function (index, name) {
				var html = '<li><a href="#">' + name + '</a></li>';
				var item = $(html);
				item.data('service-index', index);
				return item[0];
			};

			var createSettings = function (name) {
				return new MockSettingsBuilder().withName(name).create();
			};

			it('should initialize components on initialize', function () {
				controller.initialize();

				expect(serviceOptions.initialize).toHaveBeenCalled();
				expect(removePrompt.initialize).toHaveBeenCalled();
				expect(savePrompt.initialize).toHaveBeenCalled();
				expect(addService.initialize).toHaveBeenCalled();
			});

			it('should display list of services', function () {
				var mockSettings1 = new MockSettingsBuilder().withName('service 1').create();
				var mockSettings2 = new MockSettingsBuilder().withName('service 2').create();
				var settings = [mockSettings1, mockSettings2];

				controller.load(settings);

				expect(serviceList.load).toHaveBeenCalledWith(settings);
				expect(serviceSettings.load).toHaveBeenCalledWith(settings);
			});

			it('should show service settings page on itemSelected', function () {
				var serviceInfo = new MockSettingsBuilder()
					.withName('service name')
					.create();
				var item = createItem(0, 'service name');
				spyServiceSettingsGetByIndex.andReturn(serviceInfo);

				serviceList.itemSelected.dispatch(item);

				expect(serviceOptions.show).toHaveBeenCalledWith(serviceInfo);
			});

			it('should update service name when selected', function () {
				spyServiceSettingsGetByIndex.andReturn(createSettings('Service name'));

				serviceList.itemSelected.dispatch(createItem(2, 'Service name'));

				expect($('.service-name')).toHaveText('Service name');
			});

			it('should update settings', function () {
				var currentSettings = new MockSettingsBuilder().create();
				var newServiceSettings = new MockSettingsBuilder().create();
				spyServiceSettingsGetByIndex.andReturn(currentSettings);
				serviceList.itemSelected.dispatch(createItem(0, currentSettings.name));

				serviceOptions.on.updated.dispatch(newServiceSettings);

				expect(serviceSettings.update).toHaveBeenCalledWith(currentSettings, newServiceSettings);
			});

			it('should update settings multiple times', function () {
				var settings1 = new MockSettingsBuilder().withName('1').create();
				var settings2 = new MockSettingsBuilder().withName('2').create();
				var settings3 = new MockSettingsBuilder().withName('3').create();
				spyServiceSettingsGetByIndex.andReturn(settings1);
				serviceList.itemSelected.dispatch(createItem(0, settings1.name));

				serviceOptions.on.updated.dispatch(settings2);
				serviceOptions.on.updated.dispatch(settings3);

				expect(serviceSettings.update).toHaveBeenCalledWith(settings1, settings2);
				expect(serviceSettings.update).toHaveBeenCalledWith(settings2, settings3);
			});

			it('should signal settingsChanged when settings updated', function () {
				var newServiceSettings = new MockSettingsBuilder().create();
				var settings = [createSettings('service 1'), newServiceSettings];
				var spySettingsChanged = spyOnSignal(controller.on.settingsChanged);
				spyServiceSettingsGetAll.andReturn(settings);

				serviceOptions.on.updated.dispatch(newServiceSettings);

				expect(spySettingsChanged).toHaveBeenDispatchedWith(settings);
			});

			it('should show alert when settings saved', function () {
				var mockSettings = new MockSettingsBuilder().create();

				serviceOptions.on.updated.dispatch(mockSettings);

				expect(alert.show).toHaveBeenCalled();
			});

			it('should not display name after services cleared', function () {
				page.setServiceName('service name');

				serviceSettings.cleared.dispatch();

				expect(page.getServiceName()).toBe('');
			});

			it('should display empty page after services cleared', function () {
				serviceSettings.cleared.dispatch();

				expect(serviceOptions.show).toHaveBeenCalledWith(null);
			});

			describe('Adding service', function () {

				function add(name) {
					var serviceInfo = new MockSettingsBuilder().withName(name).create();
					addService.on.selected.dispatch(serviceInfo);
					return serviceInfo;
				}

				it('should hide service settings when adding service', function () {
					$('#service-add-button').click();

					expect(serviceOptions.show).toHaveBeenCalledWith(null);
				});

				it('should hide service name when adding service', function () {
					$('.service-name').text('service name');
					
					$('#service-add-button').click();

					expect($('.service-name')).toHaveText('Add new service');
				});

				it('should show services when adding service', function () {
					$('#service-add-button').click();

					expect(addService.show).toHaveBeenCalled();
				});

				it('should highlight button', function () {
					$('#service-add-button').click();

					expect($('#service-add-button')).toHaveClass('btn-primary');
				});

				it('should remove service highlight', function () {
					$('#service-add-button').click();

					expect(serviceList.selectItem).toHaveBeenCalledWith(null);
				});

				it('should not show if button disabled', function () {
					$('#service-add-button').addClass('disabled');

					$('#service-add-button').click();

					expect(addService.show).not.toHaveBeenCalled();
				});

				it('should prompt to save before switching to another service', function () {
					add('Server 2');
					spyServiceListGetSelectedName.andReturn('Server 2');

					serviceList.itemClicked.dispatch(createItem(0, 'Server 1'));

					expect(savePrompt.show).toHaveBeenCalledWith('Server 2');
				});

				it('should not switch if prompt to save shown', function () {
					add('Server 2');

					serviceList.itemClicked.dispatch(createItem(0, 'Server 1'));

					expect(serviceList.selectItem).not.toHaveBeenCalled();
				});

				it('should remove new service if changes discarded', function () {
					savePrompt.removeSelected.dispatch();

					expect(serviceList.update).toHaveBeenCalled();
				});

				it('should hide prompt if new service changes discarded', function () {
					savePrompt.removeSelected.dispatch();

					expect(savePrompt.hide).toHaveBeenCalled();
					expect(savePrompt.show).not.toHaveBeenCalled();
				});

				it('should not show save prompt after removing service', function () {
					spyServiceSettingsGetByIndex.andReturn(createSettings('Server 2'));
					add('Server 2');

					removePrompt.removeSelected.dispatch();
					serviceList.itemSelected.dispatch(createItem(0, 'Server 1'));

					expect(savePrompt.show.callCount).toBe(0);
				});

				it('should disable add button if new service not saved yet', function () {
					add('Service');

					expect(page.isAddButtonEnabled()).toBeFalsy();
				});

				it('should enable add button if service saved', function () {
					page.isAddButtonEnabled(false);

					serviceOptions.on.updated.dispatch(createSettings('service'));
					
					expect(page.isAddButtonEnabled()).toBeTruthy();
				});

				it('should deactivate add button if service selected', function () {
					page.isAddButtonActive(true);
					var serviceInfo = new MockSettingsBuilder().create();
					var item = createItem(0, 'service name');
					spyServiceSettingsGetByIndex.andReturn(serviceInfo);

					serviceList.itemSelected.dispatch(item);

					expect(page.isAddButtonActive()).toBeFalsy();
				});

				it('should hide new service list if service selected', function () {
					var serviceInfo = new MockSettingsBuilder().create();
					var item = createItem(0, 'service name');
					spyServiceSettingsGetByIndex.andReturn(serviceInfo);

					serviceList.itemSelected.dispatch(item);

					expect(addService.hide).toHaveBeenCalled();
				});

				it('should enable add button if new service removed', function () {
					add('Service');

					savePrompt.removeSelected.dispatch();

					expect(page.isAddButtonEnabled()).toBeTruthy();
				});

			});

			describe('Removing service', function () {

				it('should show confirmation dialog before removing', function () {
					spyServiceListGetSelectedName.andReturn('some name');

					page.removeService();

					expect(removePrompt.show).toHaveBeenCalledWith('some name');
				});

				it('should remove service on removeSelected', function () {
					removePrompt.removeSelected.dispatch();

					expect(serviceList.update).toHaveBeenCalled();
					expect(serviceSettings.remove).toHaveBeenCalled();
				});

				it('should dispatch settingsChanged after removing service', function () {
					var settingsChangedSpy = spyOnSignal(controller.on.settingsChanged);

					removePrompt.removeSelected.dispatch();

					expect(settingsChangedSpy).toHaveBeenDispatched();
				});

			});
		});
	});