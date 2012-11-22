/**
*   jQuery implementation of domBuilder
*
*	v 0.2.5 - reverted to method style, jQuery had too many conflicts on $([]) and $({})
*	v 0.2.4 - significant performance improvement, much better recursion
*	v 0.2.3 - better way to split str for tag#id.class
*	v 0.2.2 - slight performance tweaks
*	v 0.2.1 - updated to add void elements
*
*/

var findTag = /^([a-zA-Z1-6]+)/i,
	findID = /#([a-z0-9\-_]+)/i,
	findClasses = /\.([a-z0-9\-_]+)/gi,
	addClassNameAttr = (document.attachEvent) ? true : false,
	voidElements = {
			area:1, base:1, br:1, col:1, command:1, embed:1, hr:1,
			iframe:1, img:1, input:1, keygen:1, link:1, meta:1, object:1,
			param:1, script:1, source:1, style:1, track:1, wbr:1
	};

// After careful testing, this seems the most efficient way to split the string into parts
function splitEleStr(str) {
	var tag, id, classNames, y,
		hasDot = str.indexOf("."),
		hasHash = str.indexOf("#");

	// Do test to establish if no id or classes
	if(hasDot < 0 &&  hasHash < 0) {
		return [str,"",""];
	}

	tag = str.match(findTag)[0];
	id = (hasHash > 0) ? str.match(findID)[1] : "";
	if(hasDot > 0) {
		classNames = (hasDot > 0) ? str.match(findClasses) : [];
		y = classNames.length;

		while (y--) {
			classNames[y] = classNames[y].substr(1);
		}
		classNames = classNames.join(" ");
	} else {
		classNames = "";
	}

	return [tag, id, classNames];
}

// Build dom element
function createElement(str, attr) {
	var ele,
		splitStr,
		tagName;

	splitStr = splitEleStr(str);
	tagName = splitStr[0];

	ele = document.createElement(tagName);
	
	// IE limitation - if input, set the type on the next line!
	if (attr && attr.type) {
		ele.setAttribute("type", attr.type);
	}
	
	if (splitStr.length > 1) {
		// ID
		if (splitStr[1]) {
			ele.setAttribute("id", splitStr[1]);
		}

		// Classname
		if (splitStr[2]) {
			ele.setAttribute("class", splitStr[2]);
			if (addClassNameAttr) {
				ele.setAttribute("className", splitStr[2]);
			}
		}
	}
	return ele;
}

// Set attributes, events and data on a node
function nodeSpecials(node, obj) {
	
	if(!node || !obj) {
		return false;
	}

	var jqNode,
		events,
		key,
		tmp,
		theEvent;

	// Attributes
	if (obj._attr) {
		tmp = obj._attr;
		// Filter any type attributes to stop jQuery from choking
		for(key in tmp) {
			if(tmp.hasOwnProperty(key) && key !== "type") {
				node.setAttribute(key, tmp[key]);
			}
		}
	}
	// ID
	if(obj._id) {
		node.setAttribute("id",obj._id);
	}
	
	// Test if we need to do any of these
	if(obj._events || obj._data || obj._class) {
		jqNode = jQuery(node);
	}

	// Events
	if (obj._events) {
		events = obj._events;
		for (theEvent in events) {
			if (events.hasOwnProperty(theEvent)) {
				jqNode.on(theEvent, events[theEvent]);
			}
		}
	}
	// Data
	if (obj._data) {
		jqNode.data(obj._data);
	}

	// Class
	if(obj._class) {
		jqNode.addClass(obj._class);
	}
}

// This is the main recursive builder method
function builder(obj, parent) {
	var recurse = builder,
		isArray = (obj && obj.length && typeof obj !== "string"),
		isObject =  (typeof obj === "object"),
		undef = "undefined",
		empty = "",
		textKey = "_text",
		underScore = "_",
		i,
		len,
		key,
		newEle,
		makeEle = createElement,
		makeSpecials = nodeSpecials,
		voids = voidElements;

	// Node
	if (obj && isArray) {
		for (i = 0, len = obj.length; i < len; i+=1) {
			recurse(obj[i], parent);
		}
	}
	// Node
	if (obj && isObject && !isArray) {
		for (key in obj) {
			if (obj.hasOwnProperty(key)) {
				// It"s not a text node, or a meta obj
				if(key !== empty && key.charAt(0) !== underScore && obj[key]) {
					newEle = makeEle(key, obj[key]._attr);
					makeSpecials(newEle, obj[key]);
					parent.appendChild(newEle);
					recurse(obj[key], newEle);
				}
				// text node
				if(key === empty || key === textKey) {
					if(obj[key]) {
						newEle = document.createTextNode(obj[key]);
						parent.appendChild(newEle);
					}
				}
			}
		}
	}
	// Text node
	if (typeof obj !== undef && !isObject) {
		newEle = document.createTextNode(obj);
		if((parent.tagName && !voids[parent.tagName.toLowerCase()]) || parent.nodeType === 11) {
			parent.appendChild(newEle);
		}
	}
}

// Create plugin in jQuery
jQuery.extend({
	build: function(obj) {
		var fragment = document.createDocumentFragment(),
			div,
			empty;

		builder(obj, fragment);

		div = document.createElement("div");
		div.appendChild(fragment);

		empty = jQuery(div.childNodes);

		return empty;
	}
});
