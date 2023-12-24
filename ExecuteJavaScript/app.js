const fs = require('fs').promises
const path = require('path')
const { exec } = require('child_process')
const util = require('util')
const execAsync = util.promisify(exec)
const crypto = require('crypto')

const tmpDir = '/tmp'

function generateFileName() {
    const timestamp = Date.now()
    const randomValue = crypto.randomBytes(16).toString('hex')
    return `file-${timestamp}-${randomValue}`
}

module.exports.handler = async (event) => {
    try {
        const fileName = generateFileName()
        const parsedBody = JSON.parse(event.body)
        const { code, input = '' } = parsedBody
        const codePath = path.join(tmpDir, fileName + '.js')
        const inputPath = path.join(tmpDir, fileName + '.txt')

        await fs.writeFile(codePath, code)
        await fs.writeFile(inputPath, input)

        const startTime = new Date().getTime()
        const { error, stdout, stderr } = await execAsync(
            `node ${codePath} < ${inputPath}`,
            { timeout: 10000 }
        ).catch((error) => {
            if (error.killed && error.signal === 'SIGTERM') {
                throw new Error('Time limit exceeded')
            }
            throw error
        })

        const endTime = new Date().getTime()
        const executionTime = endTime - startTime
        const output = error || stderr || stdout

        await fs.unlink(codePath)
        await fs.unlink(inputPath)

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                data: output,
                status: true,
                executionTime: executionTime,
            }),
        }
    } catch (err) {
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                data: err.message,
                status: false,
            }),
        }
    }
}
