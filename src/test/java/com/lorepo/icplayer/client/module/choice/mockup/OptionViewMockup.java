package com.lorepo.icplayer.client.module.choice.mockup;

import com.google.gwt.event.shared.EventBus;
import com.lorepo.icplayer.client.module.choice.ChoiceOption;
import com.lorepo.icplayer.client.module.choice.ChoicePresenter.IOptionDisplay;

public class OptionViewMockup implements IOptionDisplay {

	public enum StyleType{
		normal,
		correct,
		wrong,
	}
	
	private ChoiceOption option;
	private boolean down = false;
	private IOptionMockupListener	listener;
	private StyleType style;
	
	
	public OptionViewMockup(ChoiceOption option){
		this.option = option;
		style = StyleType.normal;
	}
	
	
	@Override
	public void setDown(boolean down) {
		this.down = down;
		
		if(listener != null){
			listener.onOptionChanged(this, down);
		}
	}
	
	public void addListener(IOptionMockupListener l){
		listener = l;
	}

	@Override
	public boolean isDown() {
		return down;
	}

	@Override
	public ChoiceOption getModel() {
		return option;
	}

	@Override
	public void setWrongStyle() {
		style = StyleType.wrong;
	}

	@Override
	public void setCorrectStyle() {
		style = StyleType.correct;
	}

	@Override
	public void resetStyles() {
		style = StyleType.normal;
	}

	
	public StyleType getStyle(){
		return style;
	}


	@Override
	public void setEventBus(EventBus eventBus) {
		// TODO Auto-generated method stub
		
	}
}
