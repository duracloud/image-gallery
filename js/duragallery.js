var duraGallery = undefined;
function DuraGallery() {
    var self = this;
    //self.storeId = undefined;
    self.space = undefined;
    self.collection = undefined;
    self.imgUrlPrefix = undefined;
    self.collectionsJSON = undefined;
    self.collectionMods = undefined;
    self.editSpace = undefined;

    $('button.tooltipster').tooltipster({iconTouch:true});
    
    $('#btn-edit-coll').click(function() {
        // get the collections again in case they have been updated, then load
        self.getCollectionRegistry(self.loadShowEditCollections);
    });

    $('#add-space-modal').on('shown.bs.modal', function() {
        $('#txt-add-space').focus();
    });
    $('#add-space-modal').on('hidden.bs.modal', function() {
        $('#txt-add-space').val("");
    });

    $('#show-add-space').click(function() {
        $('#add-space-modal').modal('show');
    });
    
    $('#btn-remove-space').click(function() {
        var spaceSelect = $('#edit-space');
        var selected = spaceSelect.find('option:selected');
        var space = selected.attr('value');
        if(space && space.length > 0) {
            delete self.collectionMods[space];
            selected.remove();
            spaceSelect.selectedIndex=0;
            self.editSpace = undefined;
            $('#edit-collections').val("");
        }
    });

    // add space to collectionMods
    $('#add-space-modal button.btn-primary').click(function() {
        // save current space collections to self.collectionMods first
        self.saveCurrentEditSpace();

        var space = $('#txt-add-space').val();
        if(! (space in self.collectionMods)) {
            self.collectionMods[space] = [];
            self.loadMenu('#edit-space', self.collectionMods, space);
            self.editSpace = space;
            var editColl = $('#edit-collections');
            self.enableInput(editColl, true);
            editColl.val("");
            $('#add-space-modal').modal('hide');
        } else {
            alert("Space already available.");
        }
    });

    // save collection edits
    $('#collections-modal button.btn-primary').click(function() {
        // save current space collections to self.collectionMods first
        self.saveCurrentEditSpace();

        var url = window.location.protocol + "//" +window.location.host + "/durastore/image-viewer/collections.json";
        $.ajax({
            url: url,
            type: 'PUT',
            data: JSON.stringify(self.collectionMods),
            contentType: 'application/json',
            complete: function(jqxhr, status) {
                if(jqxhr.status === 201) {
                    self.collectionsJSON = self.collectionMods;
                    self.loadMenu('#space', self.collectionsJSON, self.space);
                    self.loadMenu('#collection', self.collectionsJSON[self.space], self.collection);
                    
                    // if the current space or collection no longer exists, remove the thumb images
                    if(! (self.space in self.collectionsJSON) || 
                            ($.inArray(self.collection, self.collectionsJSON[self.space]) < 0))  {
                        self.emptyGallery();
                    }

                    $('#collections-modal').modal('hide');
                } else {
                    alert("Error saving collections: " + jqxhr.statusText);
                }
            }
        });
    });

    $('#space').change(function() {
        var colSelect = $('#collection');
        colSelect.find('option').remove();
        self.space = $(this).find('option:selected').attr('value');
        var spaceCols = self.collectionsJSON[self.space];
        if(spaceCols) {
            colSelect.append($("<option/>")); // first add an empty option
            for(var i=0; i<spaceCols.length; i++) {
                colSelect.append($("<option/>", {
                    value: spaceCols[i],
                    text: spaceCols[i]
                }));
            }
        }
        self.emptyGallery();
    });

    $('#collection').change(function() {
        self.collection = $(this).find('option:selected').attr('value');
        if(self.collection) {
            self.imgUrlPrefix = window.location.protocol + "//" +window.location.host + "/durastore/" + self.space + "/";
            self.getRestXml("/durastore/"+self.space+"?prefix="+self.collection+"/thumbs", function(data) {
                var json = $.xmlToJSON(data.responseXML);
                if(json) {
                    var items = json.item;
                    var galleryDiv = $('#gallery');
                    var imgsStr = "";
                    if(items) {
                        for(var i=0; i<items.length; i++) {
                            var idx = items[i].Text.lastIndexOf("/") + 1;
                            var imgName = items[i].Text.substring(idx);
                            
                            var wrapDiv = $('<div>', {style: "display:inline-block"});
                            var link = $('<a>', {href: self.imgUrlPrefix + self.collection + "/previews/" + imgName, title: items[i].Text})
                            var img = $('<img>', {src: self.imgUrlPrefix + self.collection + "/thumbs/" + imgName, alt: self.collection + '/highres/' + imgName});
                            var imgTitle = $('<p>' + imgName + '</p>');
                            img.load(function() {
                                // set parent div width to width of image
                                $(this).closest('div').width($(this).width());
                            });
                            link.append(img);
                            wrapDiv.append(link);
                            wrapDiv.append(imgTitle);
                            galleryDiv.append(wrapDiv);
                        }
                    }
                    // activate tooltips
                    $('a.tooltipster').tooltipster({interactive:true, iconTouch:true});

                    galleryDiv.photobox('a', {'thumbs':false});
                    // using setTimeout to make sure all images were in the DOM, before the history.load() function is looking them up to match the url hash
                    setTimeout(window._photobox.history.load, 1000);
                } else {
                    self.emptyGallery();
                }
            });
        } else {
            self.emptyGallery();
        }
    });

    $('#edit-space').change(function() {
        var editColl = $('#edit-collections');

        // save any collection edits from previous space being edited
        self.saveCurrentEditSpace();

        // set self.editSpace to the new space being edited
        self.editSpace = $(this).find('option:selected').attr('value');
        var collStr = "";
        
        editColl.val(collStr);
        if(self.editSpace) {
            var collections = self.collectionMods[self.editSpace];
            if(collections) {
                for(var i=0; i<collections.length; i++) {
                    collStr += collections[i] + "\n";
                }
                editColl.val(collStr);
            }
            self.enableInput(editColl, true);
        } else {
            self.enableInput(editColl, false);
        }
    });

    self.enableInput = function(input, enabled) {
        if(enabled) {
            input.removeAttr("readonly");
            input.removeClass("disabled");
        } else {
            input.attr("readonly", "readonly");
            input.addClass("disabled");
        }
    };

    self.saveCurrentEditSpace = function() {
        if(self.editSpace) {
            var editColl = $('#edit-collections');
            var arrVals = editColl.val().split('\n');
            // remove empty strings
            var newColls = new Array();
            for(var i=0; i<arrVals.length; i++) {
                if(arrVals[i]) {
                    var val = arrVals[i].trim();
                    if(val.length > 0) {
                        newColls.push(val);
                    }
                }
            }
            self.collectionMods[self.editSpace] = newColls;
        }
    };

    self.emptyGallery = function() {
        $('#gallery').empty();
    };

    self.loadMenu = function(menuSelector, data, selectedOption) {
        var menu = $(menuSelector);
        menu.find('option').remove();
        menu.append($("<option/>")); // first add an empty option
        if(data) {
            var vals = undefined;
            if($.isArray(data)) {
                vals = data;
            } else {
                vals = Object.keys(data);
            }
            for(var i=0; i<vals.length; i++) {
                menu.append($("<option/>", {
                    value: vals[i],
                    text: vals[i]
                }));
            }
            if(selectedOption) {
                menu.find('option[value="'+selectedOption+'"]').prop("selected", true);
            }
        }
    };

    self.loadShowEditCollections = function() {
        // clone collectionsJSON for tmp mods until saved
        self.collectionMods = $.extend({}, self.collectionsJSON);

        self.loadMenu('#edit-space', self.collectionMods);
        self.editSpace = undefined;        
        var editColl = $('#edit-collections');
        editColl.val("");
        self.enableInput(editColl, false);
        $('#collections-modal').modal('show');
    };
    
    self.getRestXml = function(url, success) {
        $.ajax({
            type: "GET",
            url: url,
            dataType: "xml",
            complete: success
        });
    };

    self.getCollectionRegistry = function(optionalCallback) {
        $.getJSON("/durastore/image-viewer/collections.json", function(data) {
            self.collectionsJSON = data;
            self.loadMenu('#space', self.collectionsJSON, self.space);
            if(optionalCallback) optionalCallback();
        });
    };
};

// initialize things
$(function() {
    duraGallery = new DuraGallery();
    duraGallery.getCollectionRegistry();
});