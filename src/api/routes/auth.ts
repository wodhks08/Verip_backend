import { Router, Request, Response } from 'express'
import Container, { Service, Inject } from 'typedi'
import { AuthService } from '../../services/auth'

const route = Router()

import multer from 'multer'
import sharp from 'sharp'
import fs from 'fs'
import path from 'path'
import { v4 as uuid } from 'uuid'

fs.readdir('uploads', (err) => {
  if (err) {
    fs.mkdirSync('uploads')
  }
})

const upload = multer({
  storage: multer.diskStorage({
    // 파일이 저장될 경로
    destination(req, file, cb) {
      cb(null, 'uploads/')
    },
    filename(req, file, cb) {
      const ext = path.extname(file.originalname) // 파일 확장자
      //const timestamp = new Date().getTime().valueOf();	// 현재 시간
      // 새 파일명(기존파일명 + 시간 + 확장자)
      const uniqueId = uuid() //
      const filename = path.basename(uniqueId, ext) + ext
      cb(null, filename)
    },
  }),
})

export default async (app: Router) => {
  app.use('/auth', route)

  route.post('/exist-email', async (req: Request, res: Response) => {
    const AuthServiceInstance: AuthService = Container.get(AuthService)
    const email = req.body.email
    if ((await AuthServiceInstance.checkEmail(email)) != null) {
      res.json({
        success: true,
      })
    } else {
      res.json({
        success: false,
      })
    }
  })

  route.post('/signup', async (req: Request, res: Response) => {
    console.log('[+] singup')
    console.log(req.body)
    const email = req.body.email
    const password = req.body.password
    const id = req.body.id
    const filename = req.body.filename

    // 컨테이너에서 인스턴스를 뽑아온다.
    const AuthServiceInstance: AuthService = Container.get(AuthService)

    // 실행과 동시에 값을 확인한다.
    if (await AuthServiceInstance.signUp(email, password, id, filename)) {
      res.json({
        success: true,
      })
    } else {
      res.json({
        success: false,
      })
    }
  })
  route.post('/upload', upload.single('image'), (req: any, res) => {
    try {
      sharp(req.file.path) // 압축할 이미지 경로
        .resize({ width: 600 }) // 비율을 유지하며 가로 크기 줄이기
        .withMetadata() // 이미지의 exif데이터 유지
        .toBuffer((err, buffer) => {
          if (err) throw err
          // 압축된 파일 새로 저장(덮어씌우기)
          fs.writeFile(req.file.path, buffer, (err) => {
            if (err) throw err
          })
        })
    } catch (err) {
      console.log(err)
    }

    res.json({ filename: `${req.file.filename}` })
  })
}
