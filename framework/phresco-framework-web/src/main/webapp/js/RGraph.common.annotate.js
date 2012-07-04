/*
 * ###
 * Framework Web Archive
 * %%
 * Copyright (C) 1999 - 2012 Photon Infotech Inc.
 * %%
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *      http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ###
 */
    /**
    * o------------------------------------------------------------------------------o
    * | This file is part of the RGraph package - you can learn more at:             |
    * |                                                                              |
    * |                          http://www.rgraph.net                               |
    * |                                                                              |
    * | This package is licensed under the RGraph license. For all kinds of business |
    * | purposes there is a small one-time licensing fee to pay and for non          |
    * | commercial  purposes it is free to use. You can read the full license here:  |
    * |                                                                              |
    * |                      http://www.rgraph.net/LICENSE.txt                       |
    * o------------------------------------------------------------------------------o
    */

    if (typeof(RGraph) == 'undefined') RGraph = {isRGraph:true,type:'common'};


    /**
    * The function which controls the annotate feature
    * 
    * @param object obj The graph object
    */
    RGraph.Annotate = function (obj)
    {
        /**
        * This installs some event handlers
        */
        if (obj.Get('chart.annotatable')) {

            var canvas  = obj.canvas;
            var context = obj.context;
            
            /**
            * Capture the mouse events so we can set whther the mouse is down or not
            */
            var canvas_onmousedown = function (e)
            {
                if (e.button == 0) {

                    e.target.__object__.Set('chart.mousedown', true);

                    // Get the context
                    var obj = e.target.__object__;
                    var context = obj.context;

                    // Don't want any "joining" lines or colour "bleeding"
                    context.beginPath();

                    // Accommodate Chrome
                    var coords = RGraph.getMouseXY(e);
                    var x      = coords[0];
                    var y      = coords[1];
                    
                    // Clear the annotation recording
                    RGraph.Registry.Set('annotate.actions', [obj.Get('chart.annotate.color')]);

                    context.strokeStyle = obj.Get('chart.annotate.color');

                    context.moveTo(x, y);
                
                    // Set the lineWidth
                    context.lineWidth = 1;
                    
                    RGraph.Registry.Set('started.annotating', false);
                    RGraph.Registry.Set('chart.annotating', obj);
                    
                    /**
                    * Fire the onannotatebegin event. It also fires an event called ononnotatestart for BC purposes
                    */
                    RGraph.FireCustomEvent(obj, 'onannotatestart');
                    RGraph.FireCustomEvent(obj, 'onannotatebegin');
                }
                
                return false;
            }
            canvas.addEventListener('mousedown', canvas_onmousedown, false);
            RGraph.AddEventListener(canvas.id, 'mousedown', canvas_onmousedown);
            
            /**
            * This cancels annotating for ALL canvases
            */
            var window_onmouseup = function (e)
            {
                var obj  = RGraph.Registry.Get('chart.annotating');
                var tags = document.getElementsByTagName('canvas');

                for (var i=0; i<tags.length; ++i) {
                    if (tags[i].__object__) {
                        tags[i].__object__.Set('chart.mousedown', false);
                    }
                }

                if (e.button != 0 || !obj) {
                    return;
                }

                // Store the annotations in browser storage if it's available
                if (RGraph.Registry.Get('annotate.actions') && RGraph.Registry.Get('annotate.actions').length > 0 && window.localStorage) {

                    var id = '__rgraph_annotations_' + e.target.id + '__';
                    var annotations  = window.localStorage[id] ? window.localStorage[id] + '|' : '';
                        annotations += RGraph.Registry.Get('annotate.actions');

                    // Store the annotations information in HTML5 browser storage here
                    window.localStorage[id] = annotations;
                }
                
                // Clear the recorded annotations
                RGraph.Registry.Set('annotate.actions', []);
                
                /**
                * Fire the annotate event
                */

                RGraph.FireCustomEvent(obj, 'onannotateend');
            }
            window.addEventListener('mouseup', window_onmouseup, false);
            RGraph.AddEventListener(canvas.id, 'window_mouseup', window_onmouseup);
            
            /**
            * Canvas onmouseup event
            */
            var canvas_onmouseup = function (e)
            {
                var obj = e.target.__object__;
                
                RGraph.Registry.Set('chart.mousedown', false);
            }
            canvas.addEventListener('mouseup', canvas_onmouseup, false);
            RGraph.AddEventListener(canvas.id, 'mouseup', canvas_onmouseup);

            /**
            * The canvas onmousemove function
            */
            var canvas_onmousemove = function (e)
            {
                var e      = RGraph.FixEventObject(e);
                var obj    = e.target.__object__;
                var coords = RGraph.getMouseXY(e);
                var x      = coords[0];
                var y      = coords[1];
                var width  = canvas.width;
                var height = canvas.height;

                obj.context.lineWidth = 1;

                // Don't allow annotating in the gutter
                //
                // CHANGED 20TH DECEMBER 2010 TO ALLOW ANNOTATING IN THE GUTTER
                if (true) {
                
                    canvas.style.cursor = 'crosshair';
                
                    if (obj.Get('chart.mousedown')) {
                           
                       // Special case for HBars and Gantts with their extra wide left gutter
                       if ( (obj.type != 'hbar' && obj.type != 'gantt') || x > obj.gutterLeft) {

                           /**
                           * This is here to stop annotating in the gutter
                           */
                            if (RGraph.Registry.Get('started.annotating') == false) {
                                context.moveTo(x, y);
                                RGraph.Registry.Set('started.annotating', true)
                            }

                            context.lineTo(x, y);

                            RGraph.Registry.Set('annotate.actions', RGraph.Registry.Get('annotate.actions') + '|' + x + ',' + y);

                            context.stroke();

                            /**
                            * Fire the annotate event
                            */
                            RGraph.FireCustomEvent(obj, 'onannotate');
                        }
                    }

                } else {
                    canvas.style.cursor = 'default';
                }
            }
            canvas.addEventListener('mousemove', canvas_onmousemove, false);
            RGraph.AddEventListener(canvas.id, 'mousemove', canvas_onmousemove);

            RGraph.ReplayAnnotations(obj);
        }
    }


    /**
    * Shows the mini palette used for annotations
    * 
    * @param object e The event object
    */
    RGraph.Showpalette = function (e)
    {
        var isSafari = navigator.userAgent.indexOf('Safari') ? true : false;

        e = RGraph.FixEventObject(e);

        var canvas  = e.target.parentNode.__canvas__;
        var context = canvas.getContext('2d');
        var obj     = canvas.__object__;
        var div     = document.createElement('DIV');
        var coords  = RGraph.getMouseXY(e);
        
        div.__object__               = obj; // The graph object
        div.className                = 'RGraph_palette';
        div.style.position           = 'absolute';
        div.style.backgroundColor    = 'white';
        div.style.border             = '1px solid black';
        div.style.left               = 0;
        div.style.top                = 0;
        div.style.padding            = '3px';
        div.style.paddingBottom      = 0;
        div.style.paddingRight       = 0;
        div.style.opacity            = 0;
        div.style.boxShadow          = 'rgba(96,96,96,0.5) 3px 3px 3px';
        div.style.WebkitBoxShadow    = 'rgba(96,96,96,0.5) 3px 3px 3px';
        div.style.MozBoxShadow       = 'rgba(96,96,96,0.5) 3px 3px 3px';
        div.style.filter             = 'progid:DXImageTransform.Microsoft.Shadow(color=#666666,direction=135)';
        
        var common_css       = 'padding: 1px; display: inline; display: inline-block; width: 15px; height: 15px; margin-right: 3px; cursor: pointer;' + (isSafari ? 'margin-bottom: 3px' : '');
        var common_mouseover = ' onmouseover="this.style.border = \'1px black solid\'; this.style.padding = 0"';
        var common_mouseout  = ' onmouseout="this.style.border = 0; this.style.padding = \'1px\'" ';

        var str = '';

        var colors = ['red', 'blue', 'green', 'black', 'yellow', 'magenta', 'pink', 'cyan', 'purple', '#ddf', 'gray', '#36905c'];

        for (i=0; i<colors.length; ++i) {
            str = str + '<span ' + common_mouseover + common_mouseout + ' style="background-color: ' + colors[i] + '; ' + common_css  + '" onclick="this.parentNode.__object__.Set(\'chart.annotate.color\', this.style.backgroundColor); this.parentNode.style.display = \'none\'; RGraph.FireCustomEvent(this.parentNode.__object__, \'onannotatecolor\')">&nbsp;</span>';
            
            // This makes the colours go across two levels
            if (i == 5) {
                str += '<br />';
            }
        }

        div.innerHTML = str;
        document.body.appendChild(div);
        
        /**
        * Now the div has been added to the document, move it up and left and set the width and height
        */
        div.style.width  = (div.offsetWidth) + 'px';
        div.style.height = (div.offsetHeight - (RGraph.isIE9up() ? 5 : 5)) + 'px';
        div.style.left   = Math.max(0, e.pageX - div.offsetWidth - 2) + 'px';
        div.style.top    = (e.pageY - div.offsetHeight - 2) + 'px';

        /**
        * Store the palette div in the registry
        */
        RGraph.Registry.Set('palette', div);
        
        setTimeout("RGraph.Registry.Get('palette').style.opacity = 0.2", 50);
        setTimeout("RGraph.Registry.Get('palette').style.opacity = 0.4", 100);
        setTimeout("RGraph.Registry.Get('palette').style.opacity = 0.6", 150);
        setTimeout("RGraph.Registry.Get('palette').style.opacity = 0.8", 200);
        setTimeout("RGraph.Registry.Get('palette').style.opacity = 1", 250);

        RGraph.HideContext();

        window.onclick = function ()
        {
            RGraph.HidePalette();
        }

        // Should this be here? Yes. This function is being used as an event handler.
        e.stopPropagation();
        return false;
    }
    
    
    /**
    * Clears any annotation data from global storage
    * 
    * @param string id The ID of the canvas
    */
    RGraph.ClearAnnotations = function (id)
    {
        var canvas = document.getElementById(id);
        var obj    = canvas.__object__;

        if (window.localStorage && window.localStorage['__rgraph_annotations_' + id + '__'] && window.localStorage['__rgraph_annotations_' + id + '__'].length) {
            window.localStorage['__rgraph_annotations_' + id + '__'] = [];
            
            RGraph.FireCustomEvent(obj, 'onannotateclear');
        }
    }


    /**
    * Replays stored annotations
    * 
    * @param object obj The graph object
    */
    RGraph.ReplayAnnotations = function (obj)
    {
        // Check for support
        if (!window.localStorage) {
            return;
        }

        var context     = obj.context;
        var annotations = window.localStorage['__rgraph_annotations_' + obj.id + '__'];
        var i, len, move, coords;

        context.beginPath();
        context.lineWidth = 2;

        if (annotations && annotations.length) {
            annotations = annotations.split('|');
        } else {
            return;
        }

        for (i=0, len=annotations.length; i<len; ++i) {
            if (!annotations[i].match(/^[0-9]+,[0-9]+$/)) {
                context.stroke();
                context.beginPath();
                context.strokeStyle = annotations[i];
                move = true;
                continue;
            }
            
            coords = annotations[i].split(',');

            if (move) {
                context.moveTo(coords[0], coords[1]);
                move = false;
            } else {
                context.lineTo(coords[0], coords[1]);
            }
        }
        
        context.stroke();
    }