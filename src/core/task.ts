import { ChildProcess, spawn } from 'child_process';
import { EventEmitter } from 'events';

import * as whichBuilder from 'npm-which';
import * as shellEscape from 'shell-escape';
import * as v from 'villa';

const which = whichBuilder(process.cwd()).sync;

export interface TaskOptions {
  cwd: string;
  stdout: boolean;
  stderr: boolean;
}

export class Task extends EventEmitter {
  path: string;
  running = false;

  private process: ChildProcess | undefined;

  constructor(
    public name: string,
    public executable: string,
    public args: string[],
    public options: TaskOptions,
  ) {
    super();

    try {
      this.path = which(executable);
    } catch (error) {
      this.path = executable;
    }
  }

  get line(): string {
    return shellEscape([this.executable, ...this.args]);
  }

  start(): boolean {
    if (this.running) {
      return false;
    }

    this.emit('start');
    this.running = true;

    try {
      this.process = spawn(this.path, this.args, {
        cwd: this.options.cwd,
      });
    } catch (error) {
      this.handleStop(error);
      return true;
    }

    this.process.once('error', error => this.handleStop(error));
    this.process.once('exit', code => this.handleStop(undefined, code));

    this.process.stdout.on('data', data => this.emit('stdout', data));
    this.process.stderr.on('data', data => this.emit('stderr', data));

    if (this.options.stdout) {
      this.process.stdout.pipe(process.stdout);
    }

    if (this.options.stderr) {
      this.process.stderr.pipe(process.stderr);
    }

    return true;
  }

  stop(): boolean {
    if (!this.running) {
      return false;
    }

    if (process.platform === 'win32') {
      spawn('taskkill', ['/f', '/t', '/pid', this.process!.pid.toString()]);
    } else {
      this.process!.kill();
    }

    return true;
  }

  async stopWait(): Promise<void> {
    if (this.stop()) {
      return await v.awaitable(this, 'stop');
    }
  }

  async restart(): Promise<void> {
    await this.stopWait();
    this.start();
  }

  private handleStop(error: any, code?: number): void {
    if (error) {
      this.emit('error', error);
    } else {
      this.emit('exit', code);
    }

    if (this.running) {
      this.emit('stop');
      this.running = false;
    }
  }
}
