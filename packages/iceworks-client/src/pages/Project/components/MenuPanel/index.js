import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';
import { Tab, Message } from '@alifd/next';
import useModal from '@hooks/useModal';
import cloneDeep from 'lodash.clonedeep';
import MenuTreeConfig from '@components/MenuTreeConfig';
import ActionStatus from '@components/ActionStatus';
import traverse from '@utils/traverse';
import CreateMenuModal from './CreateMenuModal';
import DeleteMenuModal from './DeleteMenuModal';

import Panel from '../Panel';
import PanelHead from '../Panel/head';
import stores from '../../stores';
import styles from './index.module.scss';

const { Item: TabPane } = Tab;
let currentTab = 'aside';

const MenuPanel = ({ intl, title, description }) => {
  const {
    on: onCreateModel,
    toggleModal: toggleCreateModal,
  } = useModal();
  const {
    on: onDeleteModel,
    toggleModal: toggleDeleteModal,
  } = useModal();

  const [modalData, setModalData] = useState({
    action: 'create',
  });
  const [deleteMenu, setDeleteMenu] = useState({});
  const menuStore = stores.useStore('menu');
  const { asideMenuConfig, headerMenuConfig } = menuStore;

  function onRefresh() {
    menuStore.refresh();
  }

  function onOpenModal(data) {
    setModalData(data);
    toggleCreateModal();
  }

  function onOpenCreateModal() {
    onOpenModal({
      action: 'create',
      formData: {},
    });
  }

  async function onChangeTree(menuTree) {
    await menuStore.bulkCreate({
      data: menuTree,
      options: {
        replacement: true,
        type: currentTab,
      },
    });
    setTimeout(onRefresh, 0);
  }

  async function onCreate(action, value) {
    toggleCreateModal();
    const data = currentTab === 'aside' ? asideMenuConfig : headerMenuConfig;
    const copyData = cloneDeep(data);
    if (action === 'create') {
      copyData.push(value);
    } else {
      traverse(copyData, (config) => {
        if (config.id === value.id) {
          Object.assign(config, value);
          return true;
        }
        return false;
      }, true);
    }
    await onChangeTree(copyData);
  }

  function onOpenDeleteModal(menu) {
    setDeleteMenu(menu);
    toggleDeleteModal();
  }

  async function onDelete() {
    const data = currentTab === 'aside' ? asideMenuConfig : headerMenuConfig;
    const copyData = cloneDeep(data);
    toggleDeleteModal();
    traverse(copyData, (config, parentList, index) => {
      if (config.id === deleteMenu.id) {
        parentList.splice(index, 1);
        return true;
      }
      return false;
    }, true);
    await onChangeTree(copyData);
  }

  function onChangeTab(value) {
    currentTab = value;
  }

  const operations = [
    {
      type: 'reload',
      onClick: onRefresh,
      tip: intl.formatMessage({ id: 'iceworks.project.panel.menu.button.refresh' }),
    },
    {
      type: 'plus',
      onClick: onOpenCreateModal,
      tip: intl.formatMessage({ id: 'iceworks.project.panel.menu.button.add' }),
    },
  ];

  return (
    <Panel
      header={
        <PanelHead
          title={title}
          description={description}
          operations={operations}
        />
      }
    >
      {
        !menuStore.refresh.error &&
        <div className={styles.main}>
          <CreateMenuModal
            modalData={modalData}
            on={onCreateModel}
            onCancel={toggleCreateModal}
            onOk={onCreate}
            currentType={currentTab}
          />
          <DeleteMenuModal
            on={onDeleteModel}
            onCancel={toggleDeleteModal}
            onOk={onDelete}
            menu={deleteMenu}
          />
          <Tab
            size="small"
            contentStyle={{ padding: '10px 0 0' }}
            onChange={onChangeTab}
          >
            <TabPane
              title={<FormattedMessage id="iceworks.project.panel.menu.tab.asideMenu" />}
              key="aside"
            >
              {asideMenuConfig.length ? (
                <MenuTreeConfig
                  items={asideMenuConfig}
                  onChange={onChangeTree}
                  onOpenEditModal={onOpenModal}
                  onDeleteLink={onOpenDeleteModal}
                />
              ) : (
                <Message title={<FormattedMessage id="iceworks.project.panel.menu.aside.none" />} type="help">
                  <FormattedMessage id="iceworks.project.panel.menu.aside.prompt.create" />
                </Message>
              )}
            </TabPane>
            <TabPane
              title={<FormattedMessage id="iceworks.project.panel.menu.tab.headerMenu" />}
              key="header"
            >
              {headerMenuConfig.length ? (
                <MenuTreeConfig
                  items={headerMenuConfig}
                  onChange={onChangeTree}
                  onOpenEditModal={onOpenModal}
                  onDeleteLink={onOpenDeleteModal}
                  nested={false}
                />
              ) : (
                <Message title={<FormattedMessage id="iceworks.project.panel.menu.header.none" />} type="help">
                  <FormattedMessage id="iceworks.project.panel.menu.header.prompt.create" />
                </Message>
              )}
            </TabPane>
          </Tab>
        </div>
      }
      <ActionStatus
        store={stores}
        config={[
          {
            storeName: 'menu',
            actions: [
              {
                actionName: 'refresh',
                showLoading: true,
                showError: true,
              },
            ],
          },
        ]}
      />
    </Panel>
  );
};

MenuPanel.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  intl: PropTypes.object.isRequired,
};

export default injectIntl(MenuPanel);
