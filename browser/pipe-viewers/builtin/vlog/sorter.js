// Copyright 2015 The Vanadium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

var levelSortPriority = {
  'fatal' : 1,
  'error' : 2,
  'warning' : 3,
  'info': 4
}

export function vLogSort(item1, item2, key, ascending) {
  var first = item1[key];
  var second = item2[key];
  if (!ascending) {
    first = item2[key];
    second = item1[key];
  }

  if (key === 'level') {
    first = levelSortPriority[first];
    second = levelSortPriority[second];
  }

  if (typeof first === 'string') {
    return first.localeCompare(second);
  } else {
    return first - second;
  }
};
