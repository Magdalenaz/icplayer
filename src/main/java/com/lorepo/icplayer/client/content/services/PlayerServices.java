package com.lorepo.icplayer.client.content.services;

import com.google.gwt.core.client.JavaScriptObject;
import com.google.gwt.event.shared.EventBus;
import com.google.gwt.event.shared.ResettableEventBus;
import com.google.gwt.event.shared.SimpleEventBus;
import com.lorepo.icplayer.client.AppController;
import com.lorepo.icplayer.client.PlayerApp;
import com.lorepo.icplayer.client.module.api.IPresenter;
import com.lorepo.icplayer.client.module.api.player.IContent;
import com.lorepo.icplayer.client.module.api.player.IPlayerCommands;
import com.lorepo.icplayer.client.module.api.player.IPlayerServices;
import com.lorepo.icplayer.client.module.api.player.IScoreService;
import com.lorepo.icplayer.client.module.api.player.IServerService;

/**
 * Implementacja serwisów udostępnianych przez playera
 * @author Krzysztof Langner
 *
 */
public class PlayerServices implements IPlayerServices {

	private PlayerApp			theApplication;
	private PlayerCommands		playerCommands;
	private ResettableEventBus	eventBus;
	private AppController 		appController;
	private JavaScriptPlayerServices	jsServiceImpl;
	
	
	/**
	 * constructor
	 */
	public PlayerServices(AppController controller, PlayerApp playerApp) {
	
		this.appController = controller;
		eventBus = new ResettableEventBus(new SimpleEventBus());
		theApplication = playerApp;
		playerCommands = new PlayerCommands(controller.getPageController(), controller);
	}
	
	
	@Override
	public IScoreService getScoreService() {

		return 	theApplication.getScoreService();
	}

	@Override
	public IPlayerCommands getCommands() {
		
		return playerCommands;
	}


	@Override
	public IServerService getServerService() {

		return theApplication.getServerService();
	}


	@Override
	public EventBus getEventBus() {
		return eventBus;
	}


	public void resetEventBus(){

		eventBus.removeHandlers();

		if(jsServiceImpl != null){
			jsServiceImpl.resetEventListeners();
		}
		
	}


	@Override
	public IContent getModel() {
		return appController.getModel();
	}


	@Override
	public int getCurrentPageIndex() {
		return appController.getCurrentPageIndex();
	}


	@Override
	public JavaScriptObject getAsJSObject() {
		
		if(jsServiceImpl == null){
			jsServiceImpl = new JavaScriptPlayerServices(this);
		}
		
		return jsServiceImpl.getJavaScriptObject();
	}


	@Override
	public IPresenter getModule(String moduleName) {
		
		return appController.getPageController().findModule(moduleName);
	}

}
