// Command p2b is a client for the pipetobrowser service. It pipes its
// standard input to a pipetobrowser service.
package main

import (
	"flag"
	"fmt"
	"io"
	"os"

	_ "v.io/core/veyron/profiles/static"
	"v.io/core/veyron2"
	"v.io/core/veyron2/vlog"

	"p2b/vdl"
)

const usage = `
%s is a Pipe To Browser client. It allows one to pipe any stdout stream from console to the browser.
Data being piped to the browser then is displayed in a graphical and formatted way by a "viewer".

Usage:

  %s [<name>/<viewer>]

  For example:

	ls -l | p2b google/p2b/jane/console

	or

	cat cat.jpg | p2b google/p2b/jane/image

  where <name> (google/p2b/jane) is the object name where p2b
  service is running in the browser. <viewer> (console, image) specifies what
  viewer should be used to display the data.

  To redirect stderr of a process, in *nix system you can use 2>&1 before piping to P2B.

  For example many daemons may write log lines to stderr instead of stdout:

  serverd -alsologtostderr=true 2>&1 | google/p2b/jane/vlog
`

func Usage() {
	fmt.Fprintf(os.Stdout, usage, os.Args[0], os.Args[0])
}

type sender interface {
	Send(p []byte) error
}

// viewerPipeStreamWriter adapts ViewerPipeStream to io.Writer
type viewerPipeStreamWriter struct {
	sender
}

func (w viewerPipeStreamWriter) Write(p []byte) (n int, err error) {
	w.Send(p)
	return len(p), nil
}

func main() {
	flag.Parse()
	flag.Usage = Usage

	if flag.NArg() != 1 {
		Usage()
		return
	}

	ctx, shutdown := veyron2.Init()
	defer shutdown()

	name := flag.Arg(0)

	// bind to the p2b service
	s := vdl.ViewerClient(name)

	stream, err := s.Pipe(ctx)
	if err != nil {
		vlog.Errorf("failed to pipe to '%s' please ensure p2b service is running in the browser and name is correct.\nERR:%v", name, err)
		return
	}

	w := viewerPipeStreamWriter{stream.SendStream()}

	_, err = io.Copy(w, os.Stdin)
	if err != nil {
		vlog.Errorf("failed to copy the stdin pipe to the outgoing stream\nERR:%v", err)
		return
	}

	_, err = stream.Finish()
	if err != nil {
		vlog.Errorf("error finishing stream: %v", err)
		return
	}

	fmt.Println("Finished piping to browser! Thanks for using p2b.")
}