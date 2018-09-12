import {inject, observer} from '@makeflow/mobx-utils';
import classNames from 'classnames';
import React, {Component, ReactNode} from 'react';

import {
  Task,
  TaskService,
  TaskStatus,
  getTaskStatus,
} from 'services/task-service';
import {styled} from 'theme';

import {
  ListItemCloseButton,
  ListItemRestartButton,
  ListItemStartButton,
  ListItemStopButton,
} from './@list-item-buttons';

const Wrapper = styled.div`
  border-radius: 4px;
  border: 1px solid ${props => props.theme.border.light};
  padding: 8px 10px 8px 14px;
  position: relative;
  display: flex;
  justify-content: space-between;

  &::before {
    position: absolute;
    content: '';
    width: 3px;
    left: 0;
    top: 0;
    bottom: 0;
    border-top-left-radius: 4px;
    border-bottom-left-radius: 4px;
  }

  &.status-ready {
    opacity: 0.6;
  }

  &.status-running::before {
    background-color: ${props => props.theme.bar.green};
  }

  &.status-waiting::before {
    background-color: ${props => props.theme.bar.yellow};
  }

  &.status-stopped::before {
    background-color: ${props => props.theme.bar.gray};
  }
`;

const ItemTitleArea = styled.div``;

const Title = styled.div`
  color: ${props => props.theme.text.primary};
  font-size: 14px;
  margin-bottom: 4px;
`;

const SubTitle = styled.div`
  color: ${props => props.theme.text.secondary};
  font-size: 12px;
`;

const ItemOperationArea = styled.div`
  font-size: 11px;
`;

export interface ListItemProps {
  className?: string;
  task: Task;
}

@observer
export class ListItem extends Component<ListItemProps> {
  @inject
  taskService!: TaskService;

  render(): ReactNode {
    let {className, task} = this.props;

    let {status} = task;

    let statusText = getTaskStatus(task);

    return (
      <Wrapper
        className={classNames(
          'list-item',
          className,
          getStatusBarClassName(status),
        )}
      >
        <ItemTitleArea>
          <Title>{task.name}</Title>
          <SubTitle>{statusText}</SubTitle>
        </ItemTitleArea>
        <ItemOperationArea>
          {status === TaskStatus.ready || status === TaskStatus.stopped ? (
            <ListItemStartButton onClick={this.onStartButtonClick} />
          ) : (
            undefined
          )}
          {status === TaskStatus.running ? (
            <ListItemRestartButton />
          ) : (
            undefined
          )}
          {status === TaskStatus.running || status === TaskStatus.restarting ? (
            <ListItemStopButton />
          ) : (
            undefined
          )}
          {status !== TaskStatus.ready ? <ListItemCloseButton /> : undefined}
        </ItemOperationArea>
      </Wrapper>
    );
  }

  onStartButtonClick = (): void => {
    let {task} = this.props;

    this.taskService.start(task);
  };

  static Wrapper = Wrapper;
}

function getStatusBarClassName(status: TaskStatus): string {
  switch (status) {
    case TaskStatus.ready:
      return 'status-ready';
    case TaskStatus.running:
      return 'status-running';
    case TaskStatus.stopped:
      return 'status-stopped';
    case TaskStatus.restarting:
    case TaskStatus.stopping:
      return 'status-waiting';
  }
}
