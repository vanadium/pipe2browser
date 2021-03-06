// Copyright 2015 The Vanadium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

/*
 * AddPipeViewer action can be used to add a new viewer to the pipes view
 * this action can be run at anytime and user can be on any view and this action
 * will still work.
 * Depending on user preferences, user might be presented with a confirmation
 * dialog to accept seeing the incoming pipe.
 * @fileoverview
 */

import { Logger } from 'libs/logs/logger'
import { register, trigger } from 'libs/mvc/actions'

import { get as getPipeViewer } from 'pipe-viewers/manager'

import { displayError } from 'actions/display-error'
import { navigatePipesPage } from 'actions/navigate-pipes-page'
import { redirectPipe } from 'actions/redirect-pipe'

import { LoadingView } from 'views/loading/view'

import { pipesViewInstance } from 'runtime/context'

var log = new Logger('actions/add-pipe-viewer');
var ACTION_NAME = 'addPipeViewer';
var pipesPerNameCounter = {};

/*
 * Registers the add pipe viewer action
 */
export function registerAddPipeViewerAction() {
  register(ACTION_NAME, actionHandler);
}

/*
 * Triggers the add pipe viewer action
 */
export function addPipeViewer(name, stream) {
  return trigger(ACTION_NAME, name, stream);
}

/*
 * Handles the addPipeViewer action.
 * @param {string} name Name of the Pipe Viewer that is requested to play the stream.
 * @param {Vanadium.Stream} stream Stream of bytes from the p2b client.
 *
 * @private
 */
function actionHandler(name, stream) {
  log.debug('addPipeViewer action triggered');

  // Book keeping of number of pipe-viewers per name, we use this to generate
  // display names and keys like image #3
  var count = (pipesPerNameCounter[name] || 0) + 1;
  pipesPerNameCounter[name] = count;
  var tabKey = name + count;
  var tabName = 'Loading...';

  // Get the plugin that can render the stream, ask it to play it and display
  // the element returned by the pipeViewer.
  getPipeViewer(name).then((pipeViewer) => {
    tabName = pipeViewer.name + ' #' + count
    return pipeViewer.play(stream);
  }).then((pipeViewerView) => {
    // replace the loading view with the actual viewerView
    pipesViewInstance.replaceTabView(tabKey, tabName, pipeViewerView);
  }).catch((e) => { displayError(e); });

  // Add a new tab and show a loading indicator for now,
  // then replace the loading view with the actual viewer when ready
  // close the stream when tab closes
  var loadingView = new LoadingView();
  pipesViewInstance.addTab(tabKey, tabName, loadingView, () => {
    stream.end();
  });

  // Add the redirect stream action
  var icon = 'hardware:cast';
  pipesViewInstance.addToolbarAction(tabKey, icon, () => {
    redirectPipe(stream, name);
  });

  // Take the user to the pipes view.
  navigatePipesPage();
}
