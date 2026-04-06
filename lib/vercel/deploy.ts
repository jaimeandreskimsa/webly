interface DeployResult {
  deploymentId: string
  url: string
  projectId: string
}

export async function deployarSitio(
  htmlCompleto: string,
  nombreSitio: string,
  sitioId: string,
  userToken?: string | null
): Promise<DeployResult> {
  // Usa el token del cliente si tiene uno, si no usa el token del sistema
  const token = (userToken && userToken.trim()) || process.env.VERCEL_TOKEN
  if (!token) throw new Error('VERCEL_TOKEN no configurado')

  const slug = slugificar(nombreSitio) + '-' + sitioId.slice(0, 8)

  // 1. Crear o verificar proyecto
  const proyecto = await obtenerOCrearProyecto(slug, token)

  // 2. Crear deployment
  const deployment = await crearDeployment(htmlCompleto, proyecto.id, slug, token)

  return {
    deploymentId: deployment.id,
    url: `https://${deployment.url}`,
    projectId: proyecto.id,
  }
}

async function obtenerOCrearProyecto(nombre: string, token: string) {
  // Intentar crear proyecto
  const res = await fetch('https://api.vercel.com/v9/projects', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: nombre,
      framework: null,
    }),
  })

  if (res.ok) {
    return await res.json()
  }

  // Si ya existe, obtenerlo
  if (res.status === 409) {
    const getRes = await fetch(`https://api.vercel.com/v9/projects/${nombre}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return await getRes.json()
  }

  throw new Error(`Error creando proyecto Vercel: ${res.status}`)
}

async function crearDeployment(
  html: string,
  projectId: string,
  nombre: string,
  token: string
) {
  const res = await fetch('https://api.vercel.com/v13/deployments', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: nombre,
      project: projectId,
      files: [
        {
          file: 'index.html',
          data: html,
          encoding: 'utf-8',
        },
        {
          file: 'vercel.json',
          data: JSON.stringify({
            cleanUrls: true,
            trailingSlash: false,
          }),
          encoding: 'utf-8',
        },
      ],
      projectSettings: {
        framework: null,
        buildCommand: null,
        outputDirectory: null,
      },
      target: 'production',
    }),
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(`Error creando deployment Vercel: ${error}`)
  }

  const deployment = await res.json()

  // Esperar a que esté listo (máx 2 minutos)
  return await esperarDeployment(deployment.id, token)
}

async function esperarDeployment(deploymentId: string, token: string) {
  const maxIntentos = 24 // 2 minutos con 5s entre intentos
  let intentos = 0

  while (intentos < maxIntentos) {
    await sleep(5000)
    intentos++

    const res = await fetch(`https://api.vercel.com/v13/deployments/${deploymentId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    const deployment = await res.json()

    if (deployment.readyState === 'READY') {
      return deployment
    }

    if (deployment.readyState === 'ERROR') {
      throw new Error('El deployment falló en Vercel')
    }
  }

  throw new Error('Timeout esperando deployment de Vercel')
}

function slugificar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30)
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
