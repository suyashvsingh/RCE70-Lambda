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

exports.handler = async (event) => {
    try {
        const fileName = generateFileName()
        const parsedBody = JSON.parse(event.body)
        const { code, input = '' } = parsedBody
        const codePath = path.join(tmpDir, fileName + '.c')
        const inputPath = path.join(tmpDir, fileName + '.txt')
        const exePath = path.join(tmpDir, fileName)

        await fs.writeFile(codePath, code)
        await fs.writeFile(inputPath, input)

        const startTime = new Date().getTime()
        await execAsync(`g++ -o ${exePath}.exe ${codePath}`)
        const endTime = new Date().getTime()
        const executionTime = endTime - startTime

        const { error, stdout, stderr } = await execAsync(
            `${exePath}.exe < ${inputPath}`,
            { timeout: 2000 }
        ).catch((error) => {
            if (error.killed && error.signal === 'SIGTERM') {
                throw new Error('Time limit exceeded')
            }
            throw error
        })

        const output = error || stderr || stdout

        await fs.unlink(codePath)
        await fs.unlink(inputPath)
        await fs.unlink(`${exePath}.exe`)

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
