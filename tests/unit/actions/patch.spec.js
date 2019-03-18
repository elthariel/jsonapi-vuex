import { expect } from 'chai'

import createStubContext from '../stubs/context'
import createJsonapiModule from '../utils/createJsonapiModule'
import {
  jsonFormat as createJsonWidget1,
  jsonFormatPatch as createJsonWidget1Patch,
  normFormat as createNormWidget1,
  normFormatPatch as createNormWidget1Patch,
  normFormatUpdate as createNormWidget1Update,
  normFormatWithRels as createNormWidget1WithRels,
} from '../fixtures/widget1'
import { createResponseMeta } from '../fixtures/serverResponse'

describe('patch', function() {
  let jsonWidget1,
    jsonWidget1_patch,
    normWidget1,
    normWidget1_patch,
    normWidget1_update,
    jsonapiModule,
    stubContext

  beforeEach(function() {
    jsonWidget1 = createJsonWidget1()
    jsonWidget1_patch = createJsonWidget1Patch()
    normWidget1 = createNormWidget1()
    normWidget1_patch = createNormWidget1Patch()
    normWidget1_update = createNormWidget1Update()

    jsonapiModule = createJsonapiModule(this.api)
    stubContext = createStubContext(jsonapiModule)
  })

  it('should make an api call to PATCH item(s)', async function() {
    this.mockApi.onAny().reply(200, { data: jsonWidget1 })

    await jsonapiModule.actions.patch(stubContext, normWidget1_patch)

    expect(this.mockApi.history.patch[0].url).to.equal(
      `/${normWidget1_patch['_jv']['type']}/${normWidget1_patch['_jv']['id']}`
    )
  })

  it('should accept axios config as the 2nd arg in a list', async function() {
    this.mockApi.onAny().reply(200, { data: jsonWidget1 })
    const params = { filter: 'color' }

    await jsonapiModule.actions.patch(stubContext, [
      normWidget1_patch,
      { params: params },
    ])

    expect(this.mockApi.history.patch[0].params).to.equal(params)
  })

  it('should delete then add record(s) in the store (from server response)', async function() {
    this.mockApi.onAny().reply(200, { data: jsonWidget1_patch })

    await jsonapiModule.actions.patch(stubContext, normWidget1_patch)

    expect(stubContext.commit).to.have.been.calledWith(
      'deleteRecord',
      normWidget1_patch
    )
    expect(stubContext.commit).to.have.been.calledWith(
      'addRecords',
      normWidget1_update
    )
  })

  it('should update record(s) in the store (no server response)', async function() {
    this.mockApi.onAny().reply(204)

    await jsonapiModule.actions.patch(stubContext, normWidget1_patch)

    expect(stubContext.commit).to.have.been.calledWith(
      'updateRecord',
      normWidget1_patch
    )
  })

  it("should return data via the 'get' getter", async function() {
    this.mockApi.onAny().reply(204)

    await jsonapiModule.actions.patch(stubContext, normWidget1_patch)

    expect(stubContext.getters.get).to.have.been.calledWith(normWidget1_patch)
  })

  it('should preserve json in _jv in returned data', async function() {
    let meta = createResponseMeta()
    let jm = createJsonapiModule(this.api, { preserveJson: true })
    // Mock server data to include a meta section
    this.mockApi.onAny().reply(200, { data: jsonWidget1, ...meta })

    let res = await jm.actions.patch(stubContext, normWidget1_patch)

    // json should now be nested in _jv/json
    expect(res['_jv']['json']).to.deep.equal(meta)
  })

  it('should handle API errors', async function() {
    this.mockApi.onAny().reply(500)

    try {
      await jsonapiModule.actions.patch(stubContext, normWidget1)
    } catch (error) {
      expect(error.response.status).to.equal(500)
    }
  })

  it('should not include rels in requests', async function() {
    this.mockApi.onAny().reply(204)
    const widget = createNormWidget1WithRels()

    await jsonapiModule.actions.patch(stubContext, widget)

    expect(JSON.parse(this.mockApi.history.patch[0].data)).to.deep.equal({
      data: jsonWidget1,
    })
  })
})