;
(function($, window) {
	"use strict";

	function isType(type) {
		return function(obj) {
			return Object.prototype.toString.call(obj) === "[object " + type + "]";
		}
	}
	var isArray = isType("Array");
	var isObject = isType("Object");
	var isUndefined = isType("Undefined");
	var isString = isType("String");
	var isNumber = isType("Number");
	var JTable = function(options) {
		this.options = {
			target: null,
			heads: [],
			data: [],
			trParser: function(trObj) {
				return parseTr(trObj);
			},
			tdParser: function(tdObj) {
				return parseTd(tdObj);
			},
			pagination: {
				enabled: false,
			},
			dataPreProcess:function(data){},
		};
		$.extend(true, this.options, options);
		var options = this.options;
		var self = this;

		preprocessingOptions();
		if (self !== this) {
			return {};
		}
		initThead();
		initTbody();
		initTfoot();
		eventsBinding();

		return self;

		function preprocessingOptions() {
			var target = options.target;
			if (target === null) {
				self = {};
			}
			for (var x = 0, len = options.heads.length; x < len; x++) {
				options.heads[x] = headHandler(options.heads[x]);
			}

			function headHandler(head) {
				var defaults = {
					"name": "",
					"key": undefined,
					"attributes": {},
					"sortable": false,
					"resizable": false,
					"visible": true,
					"checkBox": {
						"enabled": false,
						"isChecked": false,
						"type": "checkbox"
					}
				}
				$.extend(true, defaults, head);
				return defaults;
			}
		}

		function initThead() {
			var target = options.target;
			var heads = options.heads;
			var thTemplate = "<th {sortable} {resizable} {visible}>{checkBox}<span {attributes}>{name}</span></th>";
			var html = [];
			var str;
			for (var x = 0, len = heads.length; x < len; x++) {
				str = thTemplate.replace(/{sortable}/g, heads[x].sortable ? "data-sortable" : "")
					.replace(/{resizable}/g, heads[x].resizable ? "data-resizable" : "")
					.replace(/{visible}/g, heads[x].visible ? "data-visible" : "")
					.replace(/{checkBox}/g, heads[x].checkBox.enabled ? generateCheckBoxHtml(heads[x]) : "")
					.replace(/{attributes}/g, generateAttributesHtml(heads[x].attributes))
					.replace(/{name}/g, heads[x].name);
				html.push(str);
			}
			target.append("<thead><tr>" + html.join("") + "</tr></thead>");

			function generateAttributesHtml(attributes) {
				var attrTemplate = "{key}='{value}'";
				var str = [];
				for (var x = 0, len = attributes.length; x < len; x++) {
					str.push(attrTemplate.replace(/{key}/g, x).replace(/{value}/g, attributes[x]));
				}
				return str.join(" ");
			}

			function generateCheckBoxHtml(head) {
				if (head.checkBox.type.toLowerCase() === "radio") {
					return "";
				}
				return "<input type='checkbox' name='{name}' {isChecked}/>"
					.replace(/{name}/g, head.key || head.name)
					.replace(/{isChecked}/g, head.checkBox.isChecked ? "checked='checked'" : "");
			}
		}

		function initTbody() {
			var target = options.target;
			target.append("<tbody></tbody>");
			preProcessData();
			self.updateTable();
		}

		function initTfoot() {
			var target = options.target;
			target.append("<tfoot></tfoot>");
			self.updateTable();
		}

		function eventsBinding() {
			var target = options.target;
			var thead = target.find(">thead");
			var tbody = target.find(">tbody");
			thead.on("click", "input[type=checkbox]", function() {
				tbody.find("input[type=checkbox][name=" + this.name + "]").prop("checked", $(this).prop("checked"));
			});
			tbody.on("click", "input[type=checkbox]", function() {
				if ($(this).prop("checked")) {
					var checked = tbody.find("input[type=checkbox][name=" + this.name + "]");
					thead.find("input[type=checkbox][name=" + this.name + "]").prop("checked", checked.length === checked.filter(":checked").length);
				} else {
					thead.find("input[type=checkbox][name=" + this.name + "]").prop("checked", false);
				}
			});
		}

		function parseTd(tdObj) {
			return "<td>" + tdObj + "</td>"
		}

		function parseTr(trObj) {
			return "<tr></tr>";
		}
		
		function preProcessData(){
			var data = options.data;
			var dataPreProcess = options.dataPreProcess;
			for(var i = data.length;i;--i){
				dataPreProcess(data[i-1]);
			}
		}
	}

	JTable.prototype = {
		constructor: JTable,
		setRow: function(obj, isUpdate) {
			var data = this.options.data;
			this.options.dataPreProcess(obj);
			data.push(obj);
			if (isUpdate === true) {
				this.updateTable();
			}
		},
		updateTable: function(data) {
			var target = this.options.target;
			var heads = this.options.heads;
			var tdParser = this.options.tdParser;
			var trParser = this.options.trParser;
			var checkBoxTemplate = '<input type="{type}" name="{name}" {isChecked}/>';
			var keys = [];
			var checkType = [];
			var tbody = target.find(">tbody");
			var fragment = $(document.createDocumentFragment());
			var tr, td, checkBoxHtml;
			data = data || this.options.data;
			this.options.data = data;
			for (var i = 0, length = heads.length; i < length; ++i) {
				keys.push(heads[i].key || heads[i].name || "" + i);
				checkType.push(heads[i].checkBox);
			}
			if (isArray(data)) {
				for (var i = 0, length1 = data.length; i < length1; ++i) {
					tr = $(trParser(data[i]));
					for (var j = 0, length2 = keys.length; j < length2; ++j) {
						td = $(tdParser(isUndefined(data[i][keys[j]])? data[i][j]:data[i][keys[j]]));
						if (checkType[j].enabled) {
							checkBoxHtml = checkBoxTemplate.replace(/{type}/g, checkType[j].type)
								.replace(/{name}/g, keys[j])
								.replace(/{isChecked}/g, checkType[j].isChecked ? "checked='checked'" : "");
							td.prepend(checkBoxHtml);
						}
						tr.append(td);
					}
					fragment.append(tr.attr("data-index", i));
				}
				tbody.html(fragment);
			}
		},
		getCheckedRows: function(col) {
			var heads = this.options.heads;
			var target = this.options.target;
			var arr = [];
			if (isNumber(col)) {
				col = heads[col];
				if (isUndefined(col)) {
					return arr;
				}
				col = isUndefined(col.key)? col.name : col.key;
			}
			var a = target.find(">tbody").find("[name=" + col + "]:checked").parents("tr");
			for (var i = a.length; i; --i) {
				arr.push($(a[i - 1]).data("index"));
			}
			return arr;
		}
	};

	window.JTable = JTable;
})(jQuery, window);