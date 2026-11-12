/** @import { Request, ResponseToolkit, ResponseObject } from '@hapi/hapi' */
import { statusCodes } from '@defra/lis-infra-ui-services/status-codes'

/**
 * A generic health-check endpoint. Used by the platform to check if the service is up and handling requests.
 */
export const healthController = {
  /**
   * Responds with a success message.
   * @param {Request} _request - The Hapi request
   * @param {ResponseToolkit} h - The Hapi response toolkit
   * @returns {ResponseObject} The health-check response
   */
  handler(_request, h) {
    return h.response({ message: 'success' }).code(statusCodes.ok)
  }
}
