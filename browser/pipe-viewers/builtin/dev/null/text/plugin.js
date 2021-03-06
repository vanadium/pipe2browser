// Copyright 2015 The Vanadium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

/*
 * similar to dev/null, it consumes the stream without keeping it in memory but
 * it tried to decode the steaming bytes as UTF-8 string first
 * @tutorial echo "To the black hole!" | p2b users/jane@google.com/chrome/p2b/[name]/dev/null/text
 * @fileoverview
 */

import { View } from 'view';
import { PipeViewer } from 'pipe-viewer';
import { redirectPlay } from 'pipe-viewer-delegation';

class DevNullTextPipeViewer extends PipeViewer {
  get name() {
    return 'dev/null/text';
  }

  play(stream) {

    stream.setEncoding('utf8');

    stream.on('data', (buf) => {
      // consume the stream as string
      var text = buf.toString();
    });

    // redirect to regular dev/null to play the stream
    var delegatedView = redirectPlay('dev/null', stream);

    return delegatedView;
  }
}

export default DevNullTextPipeViewer;
