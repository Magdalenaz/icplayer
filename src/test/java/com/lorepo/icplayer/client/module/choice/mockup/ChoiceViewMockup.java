package com.lorepo.icplayer.client.module.choice.mockup;

import java.util.ArrayList;
import java.util.List;

import com.lorepo.icplayer.client.module.choice.ChoiceModel;
import com.lorepo.icplayer.client.module.choice.ChoiceOption;
import com.lorepo.icplayer.client.module.choice.ChoicePresenter.IDisplay;
import com.lorepo.icplayer.client.module.choice.ChoicePresenter.IOptionDisplay;
import com.lorepo.icplayer.client.module.choice.IOptionListener;

public class ChoiceViewMockup implements IDisplay, IOptionMockupListener {

	private ChoiceModel module;
	private ArrayList<IOptionDisplay>	options = new ArrayList<IOptionDisplay>();
	private IOptionListener listener;
	
	
	public ChoiceViewMockup(ChoiceModel model){
		this.module = model;
		
		createUI();
	}
	
	
	private void createUI() {

		for(ChoiceOption option : module.getOptions()){
			OptionViewMockup optionView = new OptionViewMockup(option);
			
			options.add(optionView);
			optionView.addListener(this);
		}
	}


	@Override
	public List<IOptionDisplay> getOptions() {
		return options;
	}

	@Override
	public void setEnabled(boolean b) {
		// TODO Auto-generated method stub

	}

	@Override
	public void addListener(IOptionListener listener) {
		this.listener = listener;
	}


	@Override
	public void onOptionChanged(OptionViewMockup option, boolean down) {

		if(listener != null){
			listener.onValueChange(option, down);
		}
	}


}
