/** @jsx jsx */
import { jsx } from '@emotion/core'
import { Button } from '@sumup/circuit-ui'
import SelectorGroup from '@sumup/circuit-ui/dist/es/components/SelectorGroup'
import React, {
  ChangeEvent,
  MouseEventHandler,
  useCallback,
  useMemo,
  useState,
} from 'react'
import css from '@emotion/css/macro'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-toastify'
import tw from 'twin.macro'
import useSWR, { mutate } from 'swr'
import { List, AutoSizer, ListRowRenderer } from 'react-virtualized'

import FixedFullscreenContainer from '../../components/FixedFullscreenContainer'
import PageTitle from '../../components/PageTitle'
import { DnsResult } from '../../types'
import fetcher from '../../utils/fetcher'

const Page: React.FC = () => {
  const { t } = useTranslation()
  const [group, setGroup] = useState<'dynamic' | 'static'>('dynamic')
  const { data: dnsResult, error: dnsResultError } = useSWR<DnsResult>(
    '/dns',
    fetcher,
  )
  const list = useMemo(() => {
    if (group === 'dynamic') {
      return dnsResult?.dnsCache ?? []
    }
    return dnsResult?.local ?? []
  }, [dnsResult, group])

  const flushDns: MouseEventHandler = () => {
    fetcher({
      url: '/dns/flush',
      method: 'POST',
    })
      .then(() => {
        toast.success(t('common.success_interaction'))
        return mutate('/dns')
      })
      .catch((err) => {
        toast.error(t('common.failed_interaction'))
        console.error(err)
      })
  }

  const openIpDetail = (ip: string) => {
    window.open(`https://ip.sb/ip/${ip}`, '_blank', 'noopener noreferrer')
  }

  const rowRenderer: ListRowRenderer = useCallback(
    ({
      key, // Unique key within array of rows
      index, // Index of row within collection
      isScrolling, // The List is currently being scrolled
      isVisible, // This row is visible within the List (eg it is not an overscanned row)
      style, // Style object to be applied to row (to position it)
    }) => {
      if (group === 'dynamic') {
        const record = (list as DnsResult['dnsCache'])[index]

        return (
          <div
            key={key}
            style={style}
            onClick={() => openIpDetail(record.data[0])}
            css={[
              tw`flex flex-col justify-center py-2`,
              tw`cursor-pointer hover:bg-gray-100`,
              css`
                padding-left: calc(env(safe-area-inset-left) + 0.75rem);
                padding-right: calc(env(safe-area-inset-right) + 0.75rem);
              `,
            ]}
          >
            <div tw="text-sm truncate">{record.domain}</div>
            <div tw="text-xs text-gray-700 leading-tight">
              DNS: {record.server}
            </div>
            <div tw="text-xs text-gray-700 leading-tight truncate">
              {t('dns.result')}: {record.data.join(', ')}
            </div>
            <div tw="text-xs text-gray-700 leading-tight truncate">
              {t('dns.path')}: {record.path}
            </div>
          </div>
        )
      } else {
        const record = (list as DnsResult['local'])[index]

        return (
          <div
            key={key}
            style={style}
            css={[
              tw`flex flex-col justify-center py-2`,
              css`
                padding-left: calc(env(safe-area-inset-left) + 0.75rem);
                padding-right: calc(env(safe-area-inset-right) + 0.75rem);
              `,
            ]}
          >
            <div tw="text-sm truncate">{record.domain}</div>
            {!!record.server && (
              <div tw="text-xs text-gray-700 leading-tight">
                DNS: {record.server}
              </div>
            )}
            <div tw="text-xs text-gray-700 leading-tight">
              {t('dns.result')}: {record.data ?? 'N/A'}
            </div>
            <div tw="text-xs text-gray-700 leading-tight">
              {t('dns.source')}: {record.source ?? 'N/A'}
            </div>
            {!!record.comment && (
              <div tw="text-xs text-gray-700 leading-tight">
                {t('dns.comment')}: {record.comment}
              </div>
            )}
          </div>
        )
      }
    },
    [group, list],
  )

  return (
    <FixedFullscreenContainer>
      <PageTitle title="DNS" />

      <div tw="flex-1">
        <AutoSizer>
          {({ width, height }) => {
            return (
              <List
                width={width}
                height={height}
                rowCount={list.length}
                rowHeight={85}
                rowRenderer={rowRenderer}
                style={{
                  outline: 'none',
                }}
                css={css`
                  & > div {
                    ${tw`divide-y divide-gray-200`}
                  }
                `}
              />
            )
          }}
        </AutoSizer>
      </div>

      <div
        css={[
          tw`flex divide-x divide-gray-200 border-t border-solid border-gray-200 py-2 px-2`,
          css`
            & > div {
              ${tw`mx-2`}
            }
            & > div:first-of-type {
              margin-left: 0;
            }
          `,
        ]}
      >
        <SelectorGroup
          css={[
            tw`flex justify-center items-center`,
            css`
              & label {
                ${tw`py-2 px-4 ml-2 my-1 text-sm`}
              }
              & label:first-of-type {
                margin-left: 0;
              }
            `,
          ]}
          label="choose the dns result group"
          name="selector-group"
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            setGroup(event.target.value as 'dynamic' | 'static')
          }}
          options={[
            {
              children: t('dns.dynamic'),
              value: 'dynamic',
            },
            {
              children: t('dns.static'),
              value: 'static',
            },
          ]}
          value={group}
        />

        <div tw="flex items-center">
          <Button
            tw="font-normal"
            variant="tertiary"
            size="kilo"
            onClick={flushDns}
          >
            {t('dns.flush_dns')}
          </Button>
        </div>
      </div>
    </FixedFullscreenContainer>
  )
}

export default Page
