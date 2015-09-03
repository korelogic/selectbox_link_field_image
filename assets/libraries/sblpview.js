(function($, undefined){

	sblp.SBLPView = Class.extend({

		init: function($view, params){
			var defaults = {
				"select": "select.target",
				"source_list": "",
				"attribute": "rel",
				"add_selector": "a.add",
				"edit_selector": "a.edit",
				"delete_selector": "a.delete",
				"copy_selector": "a.insert-link"
			};
			
			var that = this;
			this.$view = $view;
			this.settings = $.extend({}, defaults, params);
			this.sort_order = '';

			this.addEntry();
			this.editEntry();
			this.deleteEntry();
			this.copyEntry();
						
			setTimeout(function() {
				$view.codemirror = $('textarea').data('editor');
			}, 100);

		},
		
		/**
		 * Load the sorting order
		 */
		loadSorting: function(){
			var view = this;

			var ids = sblp.getSorting(this.$view.data('id'));

			if( ids == null || ids == undefined ) return;

			// Now we have an array with all the IDs in the correct order. Now sort each container individually:
			var elements = [];
			this.$view.find(this.settings["source_list"]).each(function(){
				var id = $(this).attr(view.settings["attribute"]);
				elements['id-'+id] = [$(this).parent(), $(this).detach()];
			});

			// Now re-attach the items, according to the ids-array:
			for( var i = 0, l = ids.length; i < l; i++ ){
				if( elements['id-'+ids[i]] != undefined ){
					elements['id-'+ids[i]][0].append(elements['id-'+ids[i]][1]);
					elements['id-'+ids[i]] = undefined;
				}
			}

			// Last but not least, re-attach the items that have not been attached, to prevent later created items
			// from not being shown:
			for( i in elements ){
				if( elements[i] != undefined ){
					elements[i][0].append(elements[i][1]);
				}
			}

			// Also re-arange the options list:
			this.sortItems();
		},

		/**
		 * Sort the hidden selectbox according to the sorted elements
		 */
		sortItems: function(){
			var view = this;
			var $select = view.$view.find(view.settings["select"]);

			// Options are in an optgroup
			// Remove the options first from the optgroup
			var options = [];
			$select.find("option").each(function(){
				options[$(this).val()] = $(this).remove();
			});

			// Re-arange them according to the source_list:
			var ids = [];
			$select.html('');
			view.$view.find(view.settings["source_list"]).each(function(){
				var id = $(this).attr(view.settings["attribute"]);
				ids.push(id);
				$select.append(options[id]);
			});

			// store the order
			this.sort_order = ids;
		},

		/**
		 * Add entry management
		 */
		addEntry: function(){
			$("a.sblp-add").on('click', function(){
				sblp.current = $(this).parents('.field-selectbox_link_image').find('.sblp-view').attr('id');
				// Open an iframe popup:
				$("#sblp-white, #sblp-popup").show();
				// Use native Symphony functionality to create a new entry:
				$("#sblp-popup iframe").attr("src", $(this).parents(".field-selectbox_link_image").find(".sblp-section-selector :selected").val());
				return false;
			});
		},

		/**
		 * Edit entry management
		 */
		editEntry: function(){
			var view = this;

			this.$view.on('click', this.settings["source_list"] + ' ' + this.settings["edit_selector"], function(){
				var $parent = $(this).parents(view.settings["source_list"]);
				var id = $parent.attr(view.settings["attribute"]);
				var section = $parent.data('section');

				sblp.current = view.$view.attr('id');
				sblp.edit = true; // Set this parameter to prevent the edit-window from closing automaticly:
				sblp.$white.add(sblp.$popup).show();
				// Use native Symphony functionality to edit an entry:
				sblp.$iframe.attr("src", window.location.href.split('publish')[0]+'/publish/'+section+'/edit/'+id);
			});
		},
		
		/**
		 * Copy entry management
		 */
		copyEntry: function(){
			var view = this;

			this.$view.on('click', this.settings["source_list"] + ' ' + this.settings["copy_selector"], function(e){
				var $parent = $(this).parents(view.settings["source_list"]),
				id = $parent.attr(view.settings["attribute"]),
				section = $parent.data('section');
				sblp.current = view.$view.attr('id'),
				link = $(e.currentTarget).attr('link'),
				linkTitle = $(e.currentTarget).attr('title'),
				textToInsert = '!['+linkTitle+']('+link+' "'+linkTitle+'")',
				codemirroObj = view.$view.codemirror;
				codemirroObj.codemirror.replaceSelection('!['+linkTitle+']('+link+' "'+linkTitle+'")');
			});
		},


		/**
		 * Delete entry management
		 */
		deleteEntry: function(){
			var view = this;

			this.$view.on('click', this.settings["source_list"] + ' ' + this.settings["delete_selector"], function(e){
				var $parent = $(this).parents(view.settings["source_list"]);
				var id = $parent.attr(view.settings["attribute"]);
				var section = $parent.data('section');
				sblp.current = view.$view.attr('id');
					
				var imageThumb = $('div[rel="'+id+'"] a.thumb.insert-link').parent(),
				link = imageThumb.attr('link'),
				linkTitle = imageThumb.attr('title'),
				stringInTextarea = '!['+linkTitle+']('+link+' "'+linkTitle+'")';

				var codeMirrorObj = view.$view.codemirror.codemirror,
				existingVal = codeMirrorObj.getValue(),
				existingVal = existingVal.replace(stringInTextarea, '');
				
					
				sblp.$white.show();

				var ok = confirm('Are you sure you want to delete this entry? This entry will also be removed from other entries which are related. This action cannot be undone!');
				if( ok ){
					// Use native Symphony functionality to delete the entry:
					var data = {};
					data['action[apply]'] = 'Apply';
					data['with-selected'] = 'delete';
					data['items['+id+']'] = 'yes';

					$.post(window.location.href.split('publish')[0]+'/publish/'+section+'/', data, function(){

						imageThumb.hide();
						$('.sblp-view').append('<div id="save-prompt" style="position:fixed;bottom:-1px;width:35%;border-radius:2px 2px 0 0;text-align:center;"><span style="display: block;margin-right: 30px;background-color: #87B75D;color: #FFF;border-radius: 4px 4px 0 0;padding: 3px;font-weight: 600;border: 1px solid #77A250;">Don\'t forget to save these changes &#9662;</span></div>');
					
					//	sblp.restoreCurrentView();
						setTimeout(function() {
							$('.sblp-view #save-prompt').fadeOut(100);
						}, 4000);
						sblp.$white.hide();
						
						// remove links from textarea
						codeMirrorObj.setValue(existingVal);
					});
					
				}
				else{
					sblp.$white.hide();
				}
			});
		}
		

	});

})(jQuery);
