/* ===================================================
 * based on jQuery
 * modified:jonasyao 2014-07-31
 * ========================================================== */
$.fn.table = function(params) {
	"use strict"; // jshint ;_;
	var defaults = {
		pageKey: {
			total: "total",
			pageSize: "pageSize",
			curPage: "curPage"
		}, //表格分页涉及的key值
		ajaxUrl: "", //点击页码和页数时发送的ajax请求的url，即表格数据所在的页面路径，pageSize和curPage通过插件内部方法自动链接到该url后面
		method: "get", //ajax请求方法
		isOddClassNeed: true, // 是否需要偶数行展示样式，默认
		paramsJson: {}, //ajax请求的参数(查询条件的参数，不包括pageSize和curPage)，可以是json对象，也可以是此格式"param1=a&param2=b"
		clickFun: function(size, page) {}, //如果ajaxUrl为空，点击页码和页数时会触发此函数，此函数的两个参数分别表示当前页码和页数，通过插件传出来的，直接使用即可
		callBefore: function() {}, //ajax请求前要触发的动作，比如对于慢的分页可以加一个正在加载中的提示
		callBack: function() {}, //ajax请求完毕后的回调函数
		isHideCols: false, //是否隐藏列，如果此参数为false，则忽略后面三个参数
		defaultColsNum: [], //最原始的默认隐藏列，数字数组，0表示第一列
		hideColsNum: [], //从cookie里面取出来的默认隐藏列，如果没有使用cookie，则hideColsNum和defaultColsNum的值应保持一致
		checkboxFun: function(str) {}, //点击隐藏列复选框所触发的事件，返回所有的隐藏列号
		tbodyMaker: function() {} //构造table body的文本内容
	};
	$.extend(defaults, params);

	var $table = $(this),
		pageKey = defaults.pageKey,
		tTotal = 0,
		tPageSize = parseInt(defaults[pageKey.pageSize], 10) ? parseInt(defaults[pageKey.pageSize], 10) : 20, //默认显示的记录数
		tCurPage = parseInt(defaults[pageKey.curPage], 10) ? parseInt(defaults[pageKey.curPage], 10) : 1, //默认当前页
		tAllPages = 0,
		clickFun = defaults.clickFun,
		ajaxUrl = defaults.ajaxUrl,
		method = defaults.method,
		isOddClassNeed = defaults.isOddClassNeed,
		isHideCols = defaults.isHideCols,
		hideColsNum = defaults.hideColsNum,
		defaultColsNum = defaults.defaultColsNum,
		paramsJson = defaults.paramsJson,
		checkboxFun = defaults.checkboxFun,
		callBefore = defaults.callBefore,
		callBack = defaults.callBack,
		tbodyMaker = defaults.tbodyMaker,
		$panelBox = null,
		$thead = $table.find(">thead"),
		$tbody = $table.find(">tbody"),
		$tfoot = $table.find(">tfoot"),
		$recTotal = null,
		$recRange = null;

	$thead.find(".thead").addClass("glyphicon glyphicon-unchecked");
	$tbody = $tbody.length === 0 ? $("<tbody></tbody>").appendTo($table) : $tbody;
	$tfoot = ($tfoot.length === 0 ? $("<tfoot></tfoot>").appendTo($table) : $tfoot).hide();

	function initThead() {
		$thead.find('[data-toggle="tooltip"]').tooltip();
	}

	function refreshTfoot(total) {
		function getpageNumHtml(num, allPage, curPage) {
			for (var i = num; i <= allPage; i++) {
				if (i === curPage) {
					pageNumHtml += "<span class='page_num light_page_num'>" + i + "</span>";
				} else {
					pageNumHtml += "<span class='page_num'>" + i + "</span>";
				}
			}
		}
		if (total <= 0) {
			$tfoot.hide();
			return;
		}
		$tfoot.show();
		tAllPages = Math.ceil(total / tPageSize);
		var fIndex = tPageSize * (tCurPage - 1);
		var lIndex = tPageSize * tCurPage;
		lIndex = lIndex > total ? total : lIndex;
		$recTotal.html(total);
		$recRange.html((fIndex + 1) + "-" + lIndex);
		var pageSizeHtml = "";

		var pageNumHtml = "<div class='page_num_box'>";
		if (tCurPage === 1) {
			pageNumHtml += "<span class='pageUp' style='cursor: pointer;padding-right: 10px;color: rgb(165, 163, 163);'>上一页</span>";
		} else {
			pageNumHtml += "<span class='pageUp' style='cursor: pointer;padding-right: 10px;'>上一页</span>";
		}
		if (tAllPages === 1) {
			pageNumHtml = "<div style='display:none'>";
		} else if (tAllPages > 1 && tAllPages < 8) {
			getpageNumHtml(1, tAllPages, tCurPage);
		} else if (tCurPage < 5) {
			getpageNumHtml(1, 5, tCurPage);
			pageNumHtml += "<span class='ellipsis_num'>...</span><span class='page_num'>" + tAllPages + "</span>";
		} else if (tCurPage > tAllPages - 4) {
			pageNumHtml += "<span class='page_num'>1</span><span class='ellipsis_num'>...</span>";
			getpageNumHtml(tAllPages - 4, tAllPages, tCurPage);
		} else {
			pageNumHtml += "<span class='page_num'>1</span><span class='ellipsis_num'>...</span><span class='page_num'>" + (tCurPage - 1) + "</span><span class='page_num light_page_num'>" + tCurPage + "</span><span class='page_num'>" + (tCurPage + 1) + "</span><span class='ellipsis_num'>...</span><span class='page_num'>" + tAllPages + "</span>";
		}
		if (tCurPage === tAllPages) {
			pageNumHtml += "<span class='pageDown' style='cursor: pointer;padding-left: 10px;color: rgb(165, 163, 163);'>下一页</span>";
		} else {
			pageNumHtml += "<span class='pageDown' style='cursor: pointer;padding-left: 10px;'>下一页</span>";
		}
		pageNumHtml += "</div>";
		pageSizeHtml += pageNumHtml;
		if (tAllPages > 1) {
			pageSizeHtml += "<div> 跳到 <input class='pagebox_jump_input' name='page_num'/> 页 <div class='pageBtn' style='display: inline-block;cursor: pointer;'><span style='border-bottom: 1px solid rgb(89, 89, 89);'>GO</span></div></div>";
		}
		$tfoot.find(".pagebox_jump").html(pageSizeHtml);
	}

	function initTfoot() {
		$tfoot.html("<tr><td class='pagebox' colspan='999'><div class='pagebox_select'></div><div class='pagebox_jump'></div></td></tr>")
		var pageHtml = "<div>当前显示 <b class='page_size_box_rec_total'></b> 条中 <b class='page_size_box_rec_range'></b> 条 <select name='page_size' class='page_size'>";
		if (tPageSize === 10) {
			pageHtml += "<option value='10' selected>每页显示10行</option>";
		} else {
			pageHtml += "<option value='10'>每页显示10行</option>";
		}
		if (tPageSize === 20) {
			pageHtml += "<option value='20' selected>每页显示20行</option>";
		} else {
			pageHtml += "<option value='20'>每页显示20行</option>";
		}
		if (tPageSize === 50) {
			pageHtml += "<option value='50' selected>每页显示50行</option>";
		} else {
			pageHtml += "<option value='50'>每页显示50行</option>";
		}
		if (tPageSize === 100) {
			pageHtml += "<option value='100' selected>每页显示100行</option>";
		} else {
			pageHtml += "<option value='100'>每页显示100行</option>";
		}
		// 用于增加每页显示1000行的功能
		if (tPageSize === 1000) {
			pageHtml += "<option value='1000' selected>每页显示1000行</option>";
		} else {
			pageHtml += "<option value='1000'>每页显示1000行</option>";
		}
		pageHtml += "</select></div>";

		$tfoot.find(".pagebox_select").html(pageHtml);
		//		      $tfoot.find(".pagebox_select").html(pageHtml).find(".page_size").multiselect({
		//          header: false,
		//          multiple: false,
		//          selectedList: 1
		//      });
		$recTotal = $tfoot.find(".page_size_box_rec_total");
		$recRange = $tfoot.find(".page_size_box_rec_range");
	}

	initTableData();
	// 初始化表格数据
	function initTableData() {
		initThead();

		initTfoot();
		updateTable();
	}

	// 更新表格数据
	function updateTable() {
		if (!ajaxUrl) {
			clickFun(tPageSize, tCurPage);
		} else {
			refreshTableData(paramsJson);
		}
	}

	// 刷新表格数据
	function refreshTableData(paramsJson) {
		var dataObj = paramsJson;
		dataObj[pageKey["pageSize"]] = tPageSize;
		dataObj[pageKey["curPage"]] = tCurPage;
		Util.ajax({
			loadingText: "表格数据加载中",
			url: ajaxUrl,
			dataType: "json",
			data: dataObj,
			success: function(data) {
				tTotal = data[pageKey["total"]];
				makeTableHtml(tbodyMaker.call(null, data));
				$thead.removeClass('glyphicon-check');
				if (isOddClassNeed) {
					$tbody.find(">tr:odd").addClass("odd");
				}
				callBack.call();
				$table.resizableColumns();
				$('th[data-sort]', $table).removeClass('sort-up').removeClass('sort-down'); //移除排序相关的样式
			},
			error: function(XMLHttpRequest, textStatus, errorThrown) {}
		});
	}

	// 构造表格body和updateFoot
	function makeTableHtml(dataSet) {
		if (!dataSet) {
			tbodyHtml = "<tr><td colspan='999'>没有记录</td></tr>";
			$tbody.html(tbodyHtml);
			refreshTfoot(0);
			return;
		}
		var total = dataSet.total,
			list = dataSet.list,
			tbodyHtml = "";
		if (dataSet.total <= 0) {
			tbodyHtml = "<tr><td colspan='999'>没有记录</td></tr>";
		} else {
			var tbodyHtmlArr = [];
			if (list) {
				for (var i = 0, len = list.length; i < len; i++) {
					tbodyHtmlArr.push("<tr data-table-rowid='" + i + "'>");
					for (var j = 0, len1 = list[i].length; j < len1; j++) {
						var oItem = list[i][j];
						if (oItem && (typeof oItem.checked) == "boolean") { // 勾选框
							var tdHtmlStr;
							if (oItem.checked) {
								oItem = '<div class="glyphicon glyphicon-unchecked glyphicon-check" rowid="' + oItem.rowid + '"></div>';
							} else {
								oItem = '<div class="glyphicon glyphicon-unchecked" rowid="' + oItem.rowid + '"></div>';
							}
							tdHtmlStr = "<td>" + oItem + "</td>";
						} else if (oItem && oItem.className) {
							tdHtmlStr = "<td class='" + oItem.className + "'>" + oItem.innerHtml + "</td>";
						} else if (/(^<|>$)/.test(oItem)) {
							tdHtmlStr = "<td>" + oItem + "</td>";
						} else {
							if (oItem === undefined || oItem === null) {
								tdHtmlStr = "<td></td>";
							} else {
								tdHtmlStr = "<td title='" + oItem + "'>" + oItem + "</td>";
							}
						}
						tbodyHtmlArr.push(tdHtmlStr);
					}
					tbodyHtmlArr.push("</tr>");
				}
				tbodyHtml = tbodyHtmlArr.join("");
			}
		}
		$tbody.html(tbodyHtml);
		refreshTfoot(total);
	}

	//构造行展开
	//是否要考虑开放接口
	function API_expandRow(rowid) {
		var $tr;
		if (rowid instanceof $) {
			$tr = rowid.parents("tr");
		} else {
			$tr = $("[data-table-rowid=" + rowid + "]");
		}
		if ($tr.length === 0) {
			return;
		}
		var targetRowId = $tr.data("table-rowid");
		if (document.getElementById("table_expand_" + targetRowId)) {
			return false;
		}
		var $containTd = $("<tr class='table-row-edit-container' id='table_expand_" + targetRowId + "'><td colspan='999'></td></tr>").insertAfter($tr).find("td");
		var $containDiv = $("<div>")
		$("<div>").css({

		}).appendTo($containTd);
		return $containDiv.appendTo($containTd);
	}

	//关闭
	function API_closeRow(rowid) {
		if (typeof rowid === "undefined") {
			$(".table-row-edit-container").remove();
		} else if (typeof rowid === "string" || typeof rowid === "number") {
			$("#table_expand_" + rowid).remove();
		} else if (rowid instanceof $) {
			rowid.parents(".table-row-edit-container").remove();
		}
	}

	// 对外开放的API
	// 刷新表格数据
	function API_refreshTableData(newParamsJson) {
		//tPageSize = 20;
		tCurPage = 1;
		refreshTableData(newParamsJson);
	}

	//获取勾选框数据
	function API_getCheckedRowIds() {
		var ids = [],
			$checkboxs = $tbody.find(".glyphicon-check");
		for (var i = 0, len = $checkboxs.length; i < len; i++) {
			ids.push($($checkboxs[i]).attr("rowid"));
		}
		return ids;
	}

	//获取表格属性
	function API_getAttributes() {
		return {
			"total": tTotal,
			"pageSize": tPageSize,
			"currentPage": tCurPage
		};
	}

	// 页码跳转按回车键触发
	$tfoot.on("keydown", "input", function(e) {
		if (e.keyCode === 13) {
			$tfoot.find(".pageBtn").trigger("click");
		}
	});
	// 输入框跳转到第x页，如果当前页和跳转页一致，直接return
	$tfoot.on("click", ".pageBtn", function() {
		var pageBefore = tCurPage;
		tCurPage = parseInt($tfoot.find("input").val());
		if (!$.isNumeric(tCurPage)) {
			return;
		}
		if (!tCurPage) {
			tCurPage = 1;
		}
		if (pageBefore === tCurPage) {
			return;
		}
		callBefore();

		if (tCurPage < 0) {
			tCurPage = 1;
		}
		if (tCurPage > tAllPages) {
			tCurPage = tAllPages;
		}
		updateTable();
	});

	$tfoot.on("click", ".page_num", function() {
		var $this = $(this);
		if ($this.hasClass("light_page_num")) { //如果已经是当前页
			return;
		}
		callBefore();
		tCurPage = +$this.text();
		updateTable();
	});

	$tfoot.on("click", ".pageUp", function() {
		if (tCurPage === 1) {
			return;
		}
		callBefore();
		tCurPage = tCurPage - 1;
		updateTable();
	});

	$tfoot.on("click", ".pageDown", function() {
		if (tCurPage === tAllPages) {
			return;
		}
		callBefore();
		tCurPage = tCurPage + 1;
		updateTable();
	});

	$tfoot.on("change", ".page_size", function() {
		callBefore();
		tPageSize = $tfoot.find(".page_size").val();
		tCurPage = 1; // 当前页翻到第一页
		updateTable();
	});

	/**选中，未选中切换*/
	$table.on("click", 'glyphicon-unchecked', function(e) {
		var $this = $(this);
		if ($this.hasClass('thead')) {
			//thead中的批量选择与不选按钮
			var $checkboxList = $this.closest('table').find('.glyphicon-unchecked');
			if ($this.hasClass('glyphicon-check')) {
				$checkboxList.removeClass('glyphicon-check');
			} else {
				$checkboxList.addClass('glyphicon-check');
			}
		} else {
			//tr中的按钮，控制单行
			var $thead = $this.closest('table').find('.thead');
			if ($this.hasClass('glyphicon-check')) {
				$this.removeClass('glyphicon-check');
				$thead.removeClass('glyphicon-check'); //移除表头checkbox
			} else {
				$this.addClass('glyphicon-check');
				var $emptyBoxs = $this.closest('table').find('.glyphicon-unchecked');
				var $checkedBoxs = $this.closest('table').find('.glyphicon-check');
				if ($emptyBoxs.length === $checkedBoxs.length + 1) { //如果被选中的勾选框是全部表格中的，头也选中
					$thead.addClass('glyphicon-check');
				}
			}
		}
	});

	// 返回实例，和API
	return {
		table: $table,
		refreshTableData: API_refreshTableData,
		getCheckedRowIds: API_getCheckedRowIds,
		getAttributes: API_getAttributes,
		//closeRow : API_closeRow,
		//expandRow : API_expandRow
	}
};