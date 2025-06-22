"use client"

import { useState, useCallback, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
  Scatter,
  ScatterChart,
  Cell,
} from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Calculator, TrendingUp, BookOpen, Play } from "lucide-react"

interface BrentResult {
  root: number
  iterations: number
  steps: Array<{
    iteration: number
    a: number
    b: number
    c: number
    fa: number
    fb: number
    fc: number
    method: string
    newPoint: number
    error: number
  }>
  converged: boolean
}

function brentMethod(
  func: (x: number) => number,
  a: number,
  b: number,
  tolerance = 1e-10,
  maxIterations = 100,
): BrentResult {
  const steps: BrentResult["steps"] = []

  let fa = func(a)
  let fb = func(b)

  if (fa * fb > 0) {
    throw new Error("La función debe tener signos opuestos en los extremos del intervalo")
  }

  if (Math.abs(fa) < Math.abs(fb)) {
    ;[a, b] = [b, a]
    ;[fa, fb] = [fb, fa]
  }

  let c = a
  let fc = fa
  let mflag = true
  let d = 0

  for (let i = 0; i < maxIterations; i++) {
    let s: number
    let method: string

    if (fa !== fc && fb !== fc) {
      // Interpolación cuadrática inversa
      s =
        (a * fb * fc) / ((fa - fb) * (fa - fc)) +
        (b * fa * fc) / ((fb - fa) * (fb - fc)) +
        (c * fa * fb) / ((fc - fa) * (fc - fb))
      method = "Interpolación Cuadrática"
    } else {
      // Método de la secante
      s = b - (fb * (b - a)) / (fb - fa)
      method = "Secante"
    }

    // Condiciones para usar bisección
    const condition1 = s < (3 * a + b) / 4 || s > b
    const condition2 = mflag && Math.abs(s - b) >= Math.abs(b - c) / 2
    const condition3 = !mflag && Math.abs(s - b) >= Math.abs(c - d) / 2
    const condition4 = mflag && Math.abs(b - c) < tolerance
    const condition5 = !mflag && Math.abs(c - d) < tolerance

    if (condition1 || condition2 || condition3 || condition4 || condition5) {
      s = (a + b) / 2
      mflag = true
      method = "Bisección"
    } else {
      mflag = false
    }

    const fs = func(s)
    const error = Math.abs(fs)

    steps.push({
      iteration: i + 1,
      a,
      b,
      c,
      fa,
      fb,
      fc,
      method,
      newPoint: s,
      error,
    })

    d = c
    c = b
    fc = fb

    if (fa * fs < 0) {
      b = s
      fb = fs
    } else {
      a = s
      fa = fs
    }

    if (Math.abs(fa) < Math.abs(fb)) {
      ;[a, b] = [b, a]
      ;[fa, fb] = [fb, fa]
    }

    if (Math.abs(fb) < tolerance || Math.abs(b - a) < tolerance) {
      return {
        root: b,
        iterations: i + 1,
        steps,
        converged: true,
      }
    }
  }

  return {
    root: b,
    iterations: maxIterations,
    steps,
    converged: false,
  }
}

// Funciones predefinidas
const predefinedFunctions = {
  "x^3 - 2x - 5": (x: number) => x * x * x - 2 * x - 5,
  "x^2 - 4": (x: number) => x * x - 4,
  "cos(x) - x": (x: number) => Math.cos(x) - x,
  "e^x - 2": (x: number) => Math.exp(x) - 2,
  "x^3 - x - 1": (x: number) => x * x * x - x - 1,
}

export default function BrentMethodDemo() {
  const [selectedFunction, setSelectedFunction] = useState("x^3 - 2x - 5")
  const [customFunction, setCustomFunction] = useState("")
  const [intervalA, setIntervalA] = useState("1")
  const [intervalB, setIntervalB] = useState("3")
  const [tolerance, setTolerance] = useState("1e-10")
  const [result, setResult] = useState<BrentResult | null>(null)
  const [error, setError] = useState("")

  const evaluateFunction = useCallback(
    (x: number): number => {
      if (customFunction) {
        try {
          // Función personalizada (evaluación segura básica)
          const expr = customFunction
            .replace(/\^/g, "**")
            .replace(/sin/g, "Math.sin")
            .replace(/cos/g, "Math.cos")
            .replace(/tan/g, "Math.tan")
            .replace(/exp/g, "Math.exp")
            .replace(/log/g, "Math.log")
            .replace(/sqrt/g, "Math.sqrt")
            .replace(/abs/g, "Math.abs")

          return Function("x", `return ${expr}`)(x)
        } catch {
          throw new Error("Error al evaluar la función personalizada")
        }
      } else {
        return predefinedFunctions[selectedFunction as keyof typeof predefinedFunctions](x)
      }
    },
    [selectedFunction, customFunction],
  )

  const runBrentMethod = () => {
    try {
      setError("")
      const a = Number.parseFloat(intervalA)
      const b = Number.parseFloat(intervalB)
      const tol = Number.parseFloat(tolerance)

      if (isNaN(a) || isNaN(b) || isNaN(tol)) {
        throw new Error("Por favor ingresa valores numéricos válidos")
      }

      if (a >= b) {
        throw new Error("El límite inferior debe ser menor que el superior")
      }

      const brentResult = brentMethod(evaluateFunction, a, b, tol)
      setResult(brentResult)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido")
      setResult(null)
    }
  }

  // Datos para la gráfica de la función
  const functionData = useMemo(() => {
    if (!result) return []

    const a = Number.parseFloat(intervalA)
    const b = Number.parseFloat(intervalB)
    const range = b - a
    const start = a - range * 0.2
    const end = b + range * 0.2
    const points = []

    for (let i = 0; i <= 200; i++) {
      const x = start + ((end - start) * i) / 200
      try {
        const y = evaluateFunction(x)
        if (isFinite(y) && Math.abs(y) < 1000) {
          points.push({ x, y })
        }
      } catch {
        // Ignorar puntos donde la función no se puede evaluar
      }
    }

    return points
  }, [result, intervalA, intervalB, evaluateFunction])

  // Datos para la gráfica de convergencia
  const convergenceData = useMemo(() => {
    if (!result) return []

    return result.steps.map((step) => ({
      iteration: step.iteration,
      error: Math.log10(Math.abs(step.error)),
      method: step.method,
    }))
  }, [result])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Calculator className="h-8 w-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900 tracking-wide">Método de Brent</h1>
          </div>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto font-light tracking-wide">
            Algoritmo híbrido robusto para encontrar raíces de funciones que combina bisección, secante e interpolación
            cuadrática inversa
          </p>
        </div>

        <Tabs defaultValue="demo" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="demo" className="flex items-center gap-2">
              <Play className="h-4 w-4" />
              Demostración
            </TabsTrigger>
            <TabsTrigger value="theory" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Teoría
            </TabsTrigger>
            <TabsTrigger value="analysis" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Análisis
            </TabsTrigger>
          </TabsList>

          <TabsContent value="demo" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Panel de Control */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle>Configuración</CardTitle>
                  <CardDescription>Configura la función y parámetros del método</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Función Predefinida</Label>
                    <select
                      className="w-full p-2 border rounded-md"
                      value={selectedFunction}
                      onChange={(e) => {
                        setSelectedFunction(e.target.value)
                        setCustomFunction("")
                      }}
                    >
                      {Object.keys(predefinedFunctions).map((func) => (
                        <option key={func} value={func}>
                          {func}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>Función Personalizada (opcional)</Label>
                    <Input
                      placeholder="ej: x^3 - 2*x - 5"
                      value={customFunction}
                      onChange={(e) => setCustomFunction(e.target.value)}
                    />
                    <p className="text-xs text-gray-500">Usa: ^, sin, cos, exp, log, sqrt, abs</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label>Límite Inferior (a)</Label>
                      <Input value={intervalA} onChange={(e) => setIntervalA(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Límite Superior (b)</Label>
                      <Input value={intervalB} onChange={(e) => setIntervalB(e.target.value)} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Tolerancia</Label>
                    <Input value={tolerance} onChange={(e) => setTolerance(e.target.value)} />
                  </div>

                  <Button onClick={runBrentMethod} className="w-full">
                    <Play className="h-4 w-4 mr-2" />
                    Ejecutar Método de Brent
                  </Button>

                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {result && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Resultado</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between">
                          <span className="font-medium">Raíz:</span>
                          <span className="font-mono">{result.root.toFixed(10)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Iteraciones:</span>
                          <span>{result.iterations}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Convergió:</span>
                          <Badge variant={result.converged ? "default" : "destructive"}>
                            {result.converged ? "Sí" : "No"}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">f(raíz):</span>
                          <span className="font-mono">{evaluateFunction(result.root).toExponential(3)}</span>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>

              {/* Gráficas */}
              <div className="lg:col-span-2 space-y-6">
                {/* Gráfica de la Función */}
                <Card>
                  <CardHeader>
                    <CardTitle>Visualización de la Función</CardTitle>
                    <CardDescription>Función y proceso de búsqueda de la raíz</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer
                      config={{
                        function: {
                          label: "f(x)",
                          color: "hsl(var(--chart-1))",
                        },
                        root: {
                          label: "Raíz",
                          color: "hsl(var(--chart-2))",
                        },
                      }}
                      className="h-[400px]"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={functionData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="x" type="number" scale="linear" domain={["dataMin", "dataMax"]} />
                          <YAxis />
                          <ChartTooltip
                            content={<ChartTooltipContent />}
                            formatter={(value, name) => [
                              typeof value === "number" ? value.toFixed(4) : value,
                              name === "y" ? "f(x)" : name,
                            ]}
                          />
                          <Line dataKey="y" stroke="var(--color-function)" strokeWidth={2} dot={false} name="f(x)" />
                          <ReferenceLine y={0} stroke="#666" strokeDasharray="2 2" />
                          {result && (
                            <ReferenceLine
                              x={result.root}
                              stroke="var(--color-root)"
                              strokeWidth={3}
                              label={{ value: "Raíz", position: "top" }}
                            />
                          )}
                        </LineChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>

                {/* Gráfica de Convergencia */}
                {result && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Convergencia del Método</CardTitle>
                      <CardDescription>Error en escala logarítmica por iteración</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer
                        config={{
                          error: {
                            label: "Log₁₀(Error)",
                            color: "hsl(var(--chart-3))",
                          },
                          bisection: {
                            label: "Bisección",
                            color: "hsl(var(--chart-4))",
                          },
                          secant: {
                            label: "Secante",
                            color: "hsl(var(--chart-5))",
                          },
                          quadratic: {
                            label: "Cuadrática",
                            color: "hsl(var(--chart-1))",
                          },
                        }}
                        className="h-[300px]"
                      >
                        <ResponsiveContainer width="100%" height="100%">
                          <ScatterChart data={convergenceData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="iteration" name="Iteración" />
                            <YAxis
                              name="Log₁₀(Error)"
                              label={{ value: "Log₁₀(Error)", angle: -90, position: "insideLeft" }}
                            />
                            <ChartTooltip
                              content={<ChartTooltipContent />}
                              formatter={(value, name, props) => [
                                typeof value === "number" ? value.toFixed(2) : value,
                                name === "error" ? "Log₁₀(Error)" : name,
                                props.payload?.method,
                              ]}
                            />
                            <Scatter dataKey="error" name="Error">
                              {convergenceData.map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={
                                    entry.method === "Bisección"
                                      ? "var(--color-bisection)"
                                      : entry.method === "Secante"
                                        ? "var(--color-secant)"
                                        : "var(--color-quadratic)"
                                  }
                                />
                              ))}
                            </Scatter>
                          </ScatterChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="theory" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>¿Qué es el Método de Brent?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-700">
                    El método de Brent es un algoritmo híbrido para encontrar raíces de funciones que combina la
                    robustez del método de bisección con la velocidad de convergencia de métodos más sofisticados.
                  </p>
                  <p className="text-gray-700">
                    Desarrollado por Richard Brent en 1973, este método utiliza tres técnicas:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    <li>
                      <strong>Bisección:</strong> Garantiza convergencia
                    </li>
                    <li>
                      <strong>Método de la Secante:</strong> Convergencia rápida
                    </li>
                    <li>
                      <strong>Interpolación Cuadrática Inversa:</strong> Convergencia superlineal
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Algoritmo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Pasos del Algoritmo:</h4>
                    <ol className="list-decimal list-inside space-y-1 text-sm">
                      <li>Inicializar intervalo [a,b] donde f(a)·f(b) {"<"} 0</li>
                      <li>Calcular nuevo punto usando interpolación cuadrática</li>
                      <li>Si las condiciones no se cumplen, usar secante</li>
                      <li>Si aún no se cumplen, usar bisección</li>
                      <li>Actualizar intervalo y repetir hasta convergencia</li>
                    </ol>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Ventajas</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    <li>
                      <strong>Robustez:</strong> Siempre converge si existe una raíz
                    </li>
                    <li>
                      <strong>Eficiencia:</strong> Convergencia superlineal en casos favorables
                    </li>
                    <li>
                      <strong>Adaptabilidad:</strong> Cambia de método según las condiciones
                    </li>
                    <li>
                      <strong>Sin derivadas:</strong> Solo requiere evaluaciones de la función
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Aplicaciones</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    <li>Resolución de ecuaciones no lineales</li>
                    <li>Optimización numérica</li>
                    <li>Análisis financiero (cálculo de TIR)</li>
                    <li>Ingeniería y física computacional</li>
                    <li>Bibliotecas matemáticas estándar</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-6">
            {result && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Análisis Detallado de Iteraciones</CardTitle>
                    <CardDescription>Seguimiento paso a paso del algoritmo</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2">Iter</th>
                            <th className="text-left p-2">Método</th>
                            <th className="text-left p-2">a</th>
                            <th className="text-left p-2">b</th>
                            <th className="text-left p-2">Nuevo Punto</th>
                            <th className="text-left p-2">f(x)</th>
                            <th className="text-left p-2">Error</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.steps.map((step, index) => (
                            <tr key={index} className="border-b hover:bg-gray-50">
                              <td className="p-2">{step.iteration}</td>
                              <td className="p-2">
                                <Badge
                                  variant={
                                    step.method === "Bisección"
                                      ? "secondary"
                                      : step.method === "Secante"
                                        ? "outline"
                                        : "default"
                                  }
                                >
                                  {step.method}
                                </Badge>
                              </td>
                              <td className="p-2 font-mono">{step.a.toFixed(6)}</td>
                              <td className="p-2 font-mono">{step.b.toFixed(6)}</td>
                              <td className="p-2 font-mono">{step.newPoint.toFixed(6)}</td>
                              <td className="p-2 font-mono">{step.error.toExponential(2)}</td>
                              <td className="p-2 font-mono">{Math.abs(step.b - step.a).toExponential(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Estadísticas</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span>Total iteraciones:</span>
                        <span className="font-mono">{result.iterations}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Bisección:</span>
                        <span className="font-mono">{result.steps.filter((s) => s.method === "Bisección").length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Secante:</span>
                        <span className="font-mono">{result.steps.filter((s) => s.method === "Secante").length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Cuadrática:</span>
                        <span className="font-mono">
                          {result.steps.filter((s) => s.method === "Interpolación Cuadrática").length}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Precisión</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span>Error final:</span>
                        <span className="font-mono">
                          {result.steps[result.steps.length - 1]?.error.toExponential(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tolerancia:</span>
                        <span className="font-mono">{tolerance}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Ancho final:</span>
                        <span className="font-mono">
                          {Math.abs(
                            result.steps[result.steps.length - 1]?.b - result.steps[result.steps.length - 1]?.a,
                          ).toExponential(2)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Eficiencia</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span>Convergencia:</span>
                        <Badge variant={result.converged ? "default" : "destructive"}>
                          {result.converged ? "Exitosa" : "Fallida"}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Método final:</span>
                        <span className="text-sm">{result.steps[result.steps.length - 1]?.method}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
