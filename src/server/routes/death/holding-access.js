/** @import { Request, ResponseToolkit } from '@hapi/hapi' */
import Boom from '@hapi/boom'
import {
  PERMISSIONS,
  hasPermission
} from '@defra/lis-hubs-infra-access/authorization'

// Admin is listed alongside write because a role may grant death admin
// without death write.
const DEATH_PERMISSIONS = [
  PERMISSIONS.cattleDeathWrite,
  PERMISSIONS.cattleDeathAdmin
]

/**
 * Only a user granted reporting cattle deaths on the CPH in the path may
 * report one on that holding.
 * @param {Request} request
 * @param {ResponseToolkit} h
 * @returns {symbol | Boom.Boom} h.continue when access is allowed, otherwise a 404
 */
export function demandDeathAccess(request, h) {
  const { cph } = request.params
  const { user } = request.auth.credentials

  if (
    DEATH_PERMISSIONS.some((permission) =>
      hasPermission(user, { permission, cph })
    )
  ) {
    return h.continue
  }

  // Not found rather than forbidden, so a holding's existence isn't
  // confirmed to someone not entitled to it.
  return Boom.notFound()
}
