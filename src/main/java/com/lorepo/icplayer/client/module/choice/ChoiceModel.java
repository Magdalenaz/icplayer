package com.lorepo.icplayer.client.module.choice;

import java.util.ArrayList;

import com.google.gwt.xml.client.Element;
import com.google.gwt.xml.client.NodeList;
import com.lorepo.icf.properties.IBooleanProperty;
import com.lorepo.icf.properties.IListProperty;
import com.lorepo.icf.properties.IProperty;
import com.lorepo.icf.properties.IPropertyListener;
import com.lorepo.icf.properties.IPropertyProvider;
import com.lorepo.icf.utils.XMLUtils;
import com.lorepo.icf.utils.i18n.DictionaryWrapper;
import com.lorepo.icplayer.client.module.BasicModuleModel;


/**
 * Prostokątny obszar o podanym kolorze i rodzaju ramki
 * 
 * @author Krzysztof Langner
 *
 */
public class ChoiceModel extends BasicModuleModel{

	private boolean isMulti = false;
	private ArrayList<ChoiceOption>	options = new ArrayList<ChoiceOption>();	
	private IListProperty optionsProperty;
	private int maxScore = 0;

	
	public ChoiceModel() {
		super(DictionaryWrapper.get("choice_module"));
		
		addOption(new ChoiceOption("1", "A", 1));
		addOption(new ChoiceOption("2", "B", 0));
		
		addPropertyIsMulti();
		addPropertyOptions();
		
	}
	
	
	public void addOption(ChoiceOption option) {
	
		if(isMulti && option.getValue() > 0){
			maxScore += option.getValue();
		}
		else if(option.getValue() > maxScore){
			maxScore = option.getValue();
		}
		
		options.add(option);
		option.addPropertyListener(new IPropertyListener() {
			
			@Override
			public void onPropertyChanged(IProperty source) {

				ChoiceModel.this.sendPropertyChangedEvent(optionsProperty);
			}
		});
	}


	/**
	 * @return Option at given index
	 */
	public ChoiceOption getOption(int index){
		return options.get(index);
	}
	
	
	/**
	 * @return ilość opcji
	 */
	public int getOptionCount(){
		return options.size();
	}
	
	
	public boolean isMulti() {
		return isMulti;
	}


	@Override
	public void load(Element node, String baseUrl) {
	
		super.load(node, baseUrl);
		
		options.clear();
		maxScore = 0;
		
		// Read choice node
		NodeList nodeList = node.getElementsByTagName("choice");
		if(nodeList.getLength() > 0){
			Element choice = (Element)nodeList.item(0);
			isMulti = XMLUtils.getAttributeAsBoolean(choice, "isMulti");
		}
		
		// Read options nodes
		NodeList optionNodes = node.getElementsByTagName("option");
		
		for(int i = 0; i < optionNodes.getLength(); i++){

			Element element = (Element)optionNodes.item(i);
			String optionID = Integer.toString(i+1);
			ChoiceOption option = new ChoiceOption(optionID);
			option.load(element, baseUrl);
		
			addOption(option);
		}
		
	}


	/**
	 * Remove all options
	 */
	public void removeAllOptions() {
	
		options.clear();
	}


	/**
	 * Set choice type
	 * @param multi
	 */
	public void setMulti(boolean multi) {
	
		isMulti = multi;
	}


	/**
	 * Convert module into XML
	 */
	@Override
	public String toXML() {
		
		String xml = "<choiceModule " + getBaseXML() + ">";
		
		if(isMulti){
			xml += "<choice isMulti='true'/>";
		}
		
		
		xml += "<options>";
		for(ChoiceOption option : options){
			xml += option.toXML();
		}
		xml += "</options>";

		xml += "</choiceModule>";
		
		return xml;
	}

	
	public int getMaxScore() {
		return maxScore;
	}


	private void addPropertyIsMulti() {

		IProperty property = new IBooleanProperty() {
				
			@Override
			public void setValue(String newValue) {
				boolean value = (newValue.compareToIgnoreCase("true") == 0); 
				
				if(value!= isMulti){
					isMulti = value;
					sendPropertyChangedEvent(this);
				}
			}
			
			@Override
			public String getValue() {
				if(isMulti){
					return "True";
				}
				else{
					return "False";
				}
			}
			
			@Override
			public String getName() {
				return DictionaryWrapper.get("is_multi");
			}

		};
		
		addProperty(property);
	}


	private void addPropertyOptions() {

		optionsProperty = new IListProperty() {
				
			@Override
			public void setValue(String newValue) {
			}
			
			@Override
			public String getValue() {
				return Integer.toString(options.size());
			}
			
			@Override
			public String getName() {
				return DictionaryWrapper.get("choice_item");
			}

			@Override
			public IPropertyProvider getChild(int index) {
				return options.get(index);
			}

			@Override
			public int getChildrenCount() {
				return options.size();
			}

			@Override
			public void setChildrenCount(int count) {
				resizeItemsArray(count);
				sendPropertyChangedEvent(this);
			}
		};
		
		addProperty(optionsProperty);
	}


	protected void resizeItemsArray(int count) {
		
		if(count > 0 && count < 50){
			
			if(count < options.size()){
				
				int diff = options.size()-count;
				for(int i = 0; i < diff; i++){
					options.remove(options.size()-1);
				}
			}
			else if(count > options.size()){
				int diff = count-options.size();
				for(int i = 0; i < diff; i++){
					String optionID = Integer.toString(i+options.size()+1);
					addOption(new ChoiceOption(optionID, "New Option", 0));
				}
			}
		}
	}


	public ArrayList<ChoiceOption> getOptions() {
		return options;
	}
}
