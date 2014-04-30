
  // initialize a ResourceList object, give it defaults
  var ResourceList = {
    Models: {},
    Collections: {},
    Views: {},
    Templates: {}
  }

  var ResourceReport = {
    Models: {},
    Collections: {},
    Views: {},
    Templates: {}
  }

  // Create a model for the data that we'll be working with
  ResourceList.Models.Item = Backbone.Model.extend({
    defaults: {
      'timestamp': null,
      'uniqueid': null,
      'entrytype': null,
      'resourceName': null,
      'description': null,
      'address': null,
      'latitude': null,
      'longitude': null,
      'website': null,
      'phonenumber': null,
      'othercontact': null,
      'category': null,
      'eligibilityrequirements': null,
      'hours': null,
      'languages': null,
      'medicalservices': null,
      'fees': null,
      'otherinformation': null,
      'source': null,
      'contactname': null,
      'contactphonenumber': null,
      'contactemail': null,
      'contactorganization': null,
    }
  });

  // Create a collection of the data that we have
  ResourceList.Collections.Items = Backbone.Collection.extend({
    // give it a model
    model: ResourceList.Models.Item,
    // give it a data source
    url: 'js/data/resource-spreadsheet.json'
  });

  ResourceReport.Collections.Markers = Backbone.Collection.extend({
    model: ResourceList.Models.Item
  })

  // Give the Items obejct a template in the DOM - this is to display the full list
  ResourceList.Templates.items = _.template($("#resource-list").html());
  // Create the view for the entire list
  ResourceList.Views.Items = Backbone.View.extend({
    // define the target element
    el: $("#mainContainer"),
    // define the template
    template: ResourceList.Templates.items,

    // init the view
    initialize: function () {
      this.collection.bind("reset", this.render, this);
      this.collection.bind("add", this.addOne, this);
    },

    // render the view
    render: function () {
      $(this.el).html(this.template());
      this.addAll();
    },

    // define any functions for the view
    addAll: function () {
      this.collection.each(this.addOne);
      $('.item-list').isotope({
        itemSelector: '.item',
        layoutMode: 'masonry',
        columnWidth: '.item'
      });
    },

    addOne: function (model) {
      view = new ResourceList.Views.Item({ model: model });
      $("#mainContainer ul", this.el).append(view.render());
    }
  });


  // define the view for an individual item
  ResourceList.Templates.item = _.template($("#resource").html());
  ResourceReport.Templates.item = _.template($("#report-item").html());

  var map;

  ResourceList.Views.Item = Backbone.View.extend({
    // give it a tag
    tagName: "li",
    className: "item col-lg-3",
    // tell it what template to use
    template: ResourceList.Templates.item,
    reportTemplate: ResourceReport.Templates.item,

    initialize: function(){
      this.initMap();
    },

    // render it
    render: function () {
      var uniqueIdClass = "item_" + (this.model.get('uniqueid'));
      var categoryClass = (this.model.get('category')).replace(/ /g,'-').toLowerCase();
      return $(this.el).attr('id', uniqueIdClass).addClass(categoryClass).append(this.template(this.model.toJSON())) ;
    },

    events: {
      'click .add-item': 'addItem',
      'click .more-info-button':'moreInfo'
    },

    addItem: function(e){
      e.preventDefault();
      view = this.model;
      ResourceReport.markers.add(view);
      $('#reportItems').append('<li>' + this.reportTemplate(this.model.toJSON()) + '</li>');
      $(e.target).closest('div.inner-item').addClass('added-item');
      if($(e.target).closest('li.item').hasClass('active-item')){
        $(e.target).closest('div.inner-item').find('button.more-info-button').trigger('click');
      }
      $(e.target).closest('button.add-item').hide();
      $('p.no-results').hide();
      this.addMarker();
    },

    moreInfo: function(e){
      $('button.more-info-button').val('More Info').text('More Info');
      $('.active-item').find('div.more-info').collapse('hide');
      $('.item').removeClass('active-item');
      var parent = $(e.target).closest('.item');
      parent.addClass('active-item');
      if(parent.hasClass('active-item')){
        $(e.target).val('Less Info').text('Less Info');
      }
    },

    addMarker: function(e){
      model = this.model;
      var thisLatLang = new google.maps.LatLng((model.get('latitude')),(model.get('longitude')));
      var thisTitle = (model.get('resourcename'));
      var thisAddress = (model.get('address'));
      var thisCategory = (model.get('category'));
      var uniqueIdClass = "item_" + (model.get('uniqueid'));
      var uniqueId = (model.get('uniqueid'));
      var categories = {
        'Food': 'green',
        'Physical Activity': 'red',
        'Mental Health': 'yellow',
        'Health Care': 'blue',
        'Connection People': 'purple',
        'Education': 'goldenrod',
        'Social Services and Support': 'snow',
        'Sexual Health': 'darkslategrey',
        'Substance Abuse': 'tomato',
        'Dental Care': 'orangered',
        'Other': 'orchid'
      };
      var contentString =
        '<div class="info-window-content">' +
          '<h6>' + thisTitle + '</h6>' +
          '<p>' + thisCategory + '</p>' +
          '<p>' + thisAddress + '</p>' +
        '</div>';
      var marker = new google.maps.Marker({
        position:thisLatLang,
        map: map,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 5,
          fillColor: categories[thisCategory],
          fillOpacity: 0.8,
          strokeWeight: 1,
          id: uniqueIdClass
        }
      });

      var infowindow = new google.maps.InfoWindow({
        content: contentString
      });

      google.maps.event.addListener(marker, 'mouseover', function() {
        infowindow.open(map,marker);
      });

      google.maps.event.addListener(marker, 'mouseout', function() {
        infowindow.close(map,marker);
      });

      google.maps.event.addListener(marker, 'click', function(){
        // $('.item').removeClass('active-item');
        // $('.item-list').scrollTop($('.item-list').scrollTop() + ($('#' + uniqueIdClass).position().top - 20));
        // $('#' + uniqueIdClass).toggleClass('active-item');
        infowindow.open(map, marker);
      });
    },

    initMap: function(){
      var LatLng = new google.maps.LatLng(43.0500, -87.9500);

      var myOptions = {
        zoom: 11,
        center: LatLng,
        mapTypeControl: false,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        streetViewControl: false
      };

      map = new google.maps.Map(document.getElementById('mapContainer'), myOptions);
    }

  });

  // Create a router
  ResourceList.Router = Backbone.Router.extend({
    routes: {
      "":"defaultRoute"
    },

    defaultRoute: function(){
      ResourceList.items = new ResourceList.Collections.Items();
      ResourceReport.markers = new ResourceReport.Collections.Markers();
      // Create the view
      new ResourceList.Views.Items({ collection: ResourceList.items });

      // fetch the data
      ResourceList.items.fetch();
    }
  });

  var appRouter = new ResourceList.Router();
  Backbone.history.start();


$(document).ready(function(){
  $("body").tooltip({ selector: '[data-toggle=tooltip]' });
  $('#print-page').click(function(){ window.print(); });
  $("#main-filter .btn").click(function(){
    $('.no-results').remove();
    var thisCat = $(this).attr('data-filter');
    $('.item-list').isotope({ filter: thisCat });
    var totalItems = $('.item-list').find(thisCat);
    if ($(totalItems).length < 1) {
      $('.item-list').append(
        '<div class="item col-lg-12 no-results">No results found. Please pick another category.</div>'
      );
    }
  });
});
