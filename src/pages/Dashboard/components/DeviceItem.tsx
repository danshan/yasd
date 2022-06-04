/** @jsx jsx */
import { jsx } from '@emotion/core'
import { useModal } from '@sumup/circuit-ui'
import { useHistory } from 'react-router-dom'
import { noop } from 'lodash-es'
import React, { useCallback, useMemo } from 'react'
import css from '@emotion/css/macro'
import { useTranslation } from 'react-i18next'
import tw from 'twin.macro'
import bytes from 'bytes'
import dayjs from 'dayjs'
import { ChevronRight } from '@sumup/icons'

import ActionsModal from '../../../components/ActionsModal'
import { DataRow, DataRowMain, DataRowSub } from '../../../components/Data'
import VersionSupport from '../../../components/VersionSupport'
import { useSurgeHost } from '../../../models/profile'
import { DeviceInfo } from '../../../types'
import DeviceIcon from './DeviceIcon'
import DeviceSettingsModal from './DeviceSettingsModal'

const DeviceItem = ({ device }: { device: DeviceInfo }): JSX.Element => {
  const { t } = useTranslation()
  const { setModal } = useModal()
  const surgeHost = useSurgeHost()
  const history = useHistory()

  const onDeviceSettingsClick = useCallback(() => {
    setModal({
      children({ onClose }) {
        return onClose && device.dhcpDevice ? (
          <DeviceSettingsModal
            title={device.dhcpDevice.displayName || device.name}
            dhcpDevice={device.dhcpDevice}
            onClose={onClose}
          />
        ) : (
          <React.Fragment />
        )
      },
    })
  }, [device.dhcpDevice, device.name, setModal])

  const onClick = useCallback(() => {
    const actions = [
      {
        id: 'view_requests',
        title: 'devices.view_requests',
        onClick: () => {
          history.push(`/requests?source=${device.displayIPAddress}`)
        },
      },
    ]

    if (device.dhcpDevice) {
      actions.push({
        id: 'device_settings',
        title: 'devices.device_settings',
        onClick: onDeviceSettingsClick,
      })
    }

    setModal({
      children({ onClose }) {
        return onClose ? (
          <ActionsModal
            title={device?.dhcpDevice?.displayName || device.name}
            actions={actions}
            onClose={onClose}
          />
        ) : (
          <React.Fragment />
        )
      },
    })
  }, [
    device.dhcpDevice,
    device.displayIPAddress,
    device.name,
    onDeviceSettingsClick,
    setModal,
    history,
  ])

  const gateway = useMemo<boolean>(() => {
    const { hasTCPConnection } = device
    return hasTCPConnection || Boolean(device?.dhcpDevice?.shouldHandledBySurge)
  }, [device])

  const mode = useMemo<string>(() => {
    let result = t('devices.not_handled_by_surge')
    const { hasProxyConnection } = device

    if (gateway && hasProxyConnection) {
      result = t('devices.proxy_and_gateway_mode')
    } else if (hasProxyConnection) {
      result = t('devices.proxy_mode')
    } else if (gateway) {
      result = t('devices.gateway_mode')
    }

    return result
  }, [t, device, gateway])

  const waitingToReconnect = useMemo<boolean>(() => {
    return Boolean(device?.dhcpDevice?.waitingToReconnect)
  }, [device.dhcpDevice])

  return (
    <DataRow tw="hover:bg-gray-100 cursor-pointer" onClick={onClick}>
      <DataRowMain>
        <div tw="flex items-center w-full overflow-hidden">
          {surgeHost ? (
            <VersionSupport macos="4.1.1" ios="4.11.0">
              <div tw="flex-1">
                <DeviceIcon icon={device.dhcpDevice?.icon} />
              </div>
            </VersionSupport>
          ) : (
            <React.Fragment />
          )}
          <div tw="w-full overflow-hidden">
            <div tw="truncate pr-5">{device.name}</div>
            <div tw="text-sm text-gray-600">{device.displayIPAddress}</div>
          </div>
        </div>
        <div tw="flex items-center flex-1 font-bold">
          {waitingToReconnect ? (
            <div
              css={css`
                white-space: nowrap;
              `}
            >
              {t('devices.waiting')}
            </div>
          ) : (
            (gateway || device.hasProxyConnection) && (
              <div>{bytes(device.currentSpeed) + '/s'}</div>
            )
          )}

          <div tw="ml-3">
            <ChevronRight />
          </div>
        </div>
      </DataRowMain>
    </DataRow>
  )
}

export default DeviceItem
