package com.lorepo.icplayer.client.model;

import com.google.gwt.xml.client.Element;
import com.google.gwt.xml.client.Node;
import com.google.gwt.xml.client.NodeList;
import com.lorepo.icf.properties.BasicPropertyProvider;
import com.lorepo.icf.properties.IBooleanProperty;
import com.lorepo.icf.properties.IImageProperty;
import com.lorepo.icf.properties.IProperty;
import com.lorepo.icf.utils.StringUtils;
import com.lorepo.icf.utils.URLUtils;
import com.lorepo.icf.utils.UUID;
import com.lorepo.icf.utils.XMLUtils;
import com.lorepo.icf.utils.i18n.DictionaryWrapper;
import com.lorepo.icplayer.client.framework.module.IStyleListener;
import com.lorepo.icplayer.client.framework.module.IStyledModule;
import com.lorepo.icplayer.client.module.ModuleFactory;
import com.lorepo.icplayer.client.module.api.IModuleModel;
import com.lorepo.icplayer.client.module.api.player.IPage;
import com.lorepo.icplayer.client.utils.IXMLSerializable;

/**
 * Model reprezentujący pojedyncza strone
 * 
 * @author Krzysztof Langner
 *
 */
public class Page extends BasicPropertyProvider implements IXMLSerializable, IStyledModule, IPage{

	/** Sposób pozycjonowania elementów na stronie */
	public enum LayoutType{
		percentage,
		pixels,
		flow
	}
	
	private String id;
	private String name;
	private String href;
	private LayoutType layout = LayoutType.percentage;
	private String cssClass = "";
	private String inlineStyles = "";
	private ModuleList	modules = new ModuleList();
	/** base url to this document with ending '/' */
	private String		baseURL = "";
	private IStyleListener styleListener;
	private boolean loaded = false;
	private int width;
	private int height;
	private boolean reportable = true;
	private String previewURL = "";
	// Properties
	IProperty propertyName;
	
	
	public Page(String name, String url){
	
		super("Page");
		this.id = UUID.uuid(6);
		this.name = name;
		this.href = url;
		addPropertyName();
		addPropertyWidth();
		addPropertyHeight();
		addPropertyReportable();
		addPropertyPreview();
	}
	
	
	@Override
	public String getBaseURL(){
		return baseURL;
	}

	
	/**
	 * @return Pobranie linku względnego do strony.
	 */
	public String getHref() {
		return href;
	}


	public String getURL() {
		return URLUtils.resolveURL(baseURL, href);
	}


	/**
	 * @return layout type
	 */
	public LayoutType getLayout(){
		return layout;
	}
	

	@Override
	public String getName(){
		return name;
	}
	
	
	public boolean isLoaded(){
		return loaded;
	}
	
	public void release(){
		
		for(IModuleModel module : modules){
			module.release();
		}
		
		loaded = false;
	}
	
	
	public String toString(){
		
		return "ID: " + name + ", href: " + href + " modules#: " + modules.size(); 
	}



	public void setName(String name){
		
		this.name = name; 
		sendPropertyChangedEvent(propertyName);
	}


	/**
	 * Ustawienie sposobu layoutowania strony
	 * @param pos
	 */
	public void setLayout(LayoutType newLayout) {

		layout = newLayout;
	}




	@Override
	public String toXML() {

		String xml = "<?xml version='1.0' encoding='UTF-8' ?>";
		
		xml += "<page layout='" + layout.toString() + "'";
		xml += " width='" + width + "'";
		xml += " height='" + height + "'";
		if(!cssClass.isEmpty()){
			String encodedClass = StringUtils.escapeXML(cssClass);
			xml += " class='" + encodedClass + "'";
		}
		if(!inlineStyles.isEmpty()){
			String encodedStyle = StringUtils.escapeXML(inlineStyles);
			xml += " style='" + encodedStyle + "'";
		}
		
		xml += ">";
		
		xml += "<modules>";
	
		for(IModuleModel module : modules){
			xml += module.toXML();
		}
		
		xml += 	"</modules>" + "</page>";
	
		return xml;
	}


	@Override
	public void load(Element rootElement, String url) {

		modules = new ModuleList();
		baseURL = url.substring(0, url.lastIndexOf("/")+1);

		loadPageAttributes(rootElement);
		loadModules(rootElement);
		loaded = true;
	}


	private void loadPageAttributes(Element rootElement) {
		
		width = XMLUtils.getAttributeAsInt(rootElement, "width");
		height = XMLUtils.getAttributeAsInt(rootElement, "height");
		setInlineStyle(rootElement.getAttribute("style"));
		setStyleClass(rootElement.getAttribute("class"));
		
		String positioning = rootElement.getAttribute("layout");
		if(positioning != null && positioning.compareTo(LayoutType.pixels.toString()) == 0){
			setLayout(LayoutType.pixels);
		}
	}


	private void loadModules(Element rootElement) {
		
		ModuleFactory moduleFactory = new ModuleFactory(null);
		Element modulesNode = (Element)rootElement.getElementsByTagName("modules").item(0);
		NodeList moduleNodeList = modulesNode.getChildNodes();
		
		for(int i = 0; i < moduleNodeList.getLength(); i++){

			Node node = moduleNodeList.item(i);
			if(node instanceof Element){
				
				IModuleModel module = moduleFactory.createModel(node.getNodeName());
				if(module != null){
					module.load((Element) node, getBaseURL());
					this.modules.add(module);
				}
			}
		}
	}


	private void addPropertyName() {

		propertyName = new IProperty() {
			
			@Override
			public void setValue(String newValue) {
				name = newValue;
				sendPropertyChangedEvent(this);
			}
			
			@Override
			public String getValue() {
				return name;
			}
			
			@Override
			public String getName() {
				return DictionaryWrapper.get("name");
			}
		};
		
		addProperty(propertyName);
	}


	private void addPropertyWidth() {

		IProperty property = new IProperty() {
			
			@Override
			public void setValue(String newValue) {
				try{
					width = Integer.parseInt(newValue);
				}catch(NumberFormatException e){
					width = 0;
				}
				sendPropertyChangedEvent(this);
			}
			
			@Override
			public String getValue() {
				if(width > 0){
					return Integer.toString(width);
				}
				else{
					return "";
				}
			}
			
			@Override
			public String getName() {
				return DictionaryWrapper.get("width");
			}
		};
		
		addProperty(property);
	}


	private void addPropertyHeight() {

		IProperty property = new IProperty() {
			
			@Override
			public void setValue(String newValue) {
				try{
					height = Integer.parseInt(newValue);
				}catch(NumberFormatException e){
					height = 0;
				}
				sendPropertyChangedEvent(this);
			}
			
			@Override
			public String getValue() {
				if(height > 0){
					return Integer.toString(height);
				}
				else{
					return "";
				}
			}
			
			@Override
			public String getName() {
				return DictionaryWrapper.get("height");
			}
		};
		
		addProperty(property);
	}


	private void addPropertyReportable() {

		IBooleanProperty property = new IBooleanProperty() {
			
			@Override
			public void setValue(String newValue) {
				boolean value = (newValue.compareToIgnoreCase("true") == 0); 
				
				if(value!= reportable){
					reportable = value;
					sendPropertyChangedEvent(this);
				}				
			}
			
			@Override
			public String getValue() {
				if(reportable){
					return "True";
				}
				else{
					return "False";
				}
			}
			
			@Override
			public String getName() {
				return DictionaryWrapper.get("is_reportable");
			}
		};
		
		addProperty(property);
	}


	private void addPropertyPreview() {

		propertyName = new IImageProperty() {
			
			@Override
			public void setValue(String newValue) {
				previewURL = newValue;
				sendPropertyChangedEvent(this);
			}
			
			@Override
			public String getValue() {
				return previewURL;
			}
			
			@Override
			public String getName() {
				return DictionaryWrapper.get("Preview");
			}
		};
		
		addProperty(propertyName);
	}


	@Override
	public void addStyleListener(IStyleListener listener) {
		styleListener = listener;
	}


	@Override
	public String getInlineStyle() {
		return inlineStyles;
	}


	@Override
	public String getStyleClass() {
		return cssClass;
	}


	@Override
	public void setInlineStyle(String inlineStyle) {
		
		if(inlineStyle != null){
			this.inlineStyles = inlineStyle;
			if(styleListener != null){
				styleListener.onStyleChanged();
			}
		}
	}


	@Override
	public void setStyleClass(String styleClass) {
		
		if(styleClass != null){
			this.cssClass = styleClass;

			if(styleListener != null){
				styleListener.onStyleChanged();
			}
		}
	}


	@Override
	public String getClassNamePrefix() {
		return "page";
	}


	public ModuleList getModules() {
		return modules;
	}
	
	
	public int getWidth(){
		return width;
	}
	
	
	public int getHeight(){
		return height;
	}
	
	
	public void setReportable(boolean reportable){
		this.reportable = reportable;
	}
	
	public boolean isReportable(){
		return reportable;
	}
	
	
	public String createUniquemoduleId(String baseName) {
		
		String name;
		
		for(int i = 1; i < 100; i++){
		
			name = baseName + i;
			if( modules.getModuleById(name) == null ){
				return name;
			}
		}
		
		return baseName + "_new";
	}


	public void outstreachHeight(int position, int amount) {

		for(IModuleModel module : getModules()){
			if(module.getTop() > position){
				module.disableChangeEvent(true);
				module.setTop(module.getTop()+amount);
				module.disableChangeEvent(false);
			}
		}
	}


	@Override
	public String getPreview() {
		return previewURL;
	}


	public void setPreview(String preview) {

		this.previewURL = preview;
	}


	@Override
	public String getId() {
		return id;
	}


	public void setId(String pageId) {
		this.id = pageId;
	}
	
}
